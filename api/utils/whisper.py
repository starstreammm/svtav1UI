import asyncio
import psutil
import shlex

from models import WhisperRunning, WhisperTaskInfo
from utils.logger import LoggerBase as lg
from utils.monitor import Monitor
from utils.timer import Timer


class Whisper:
    def __init__(self, task: WhisperTaskInfo):
        # init & validate task
        if not task.input.is_file() or task.input.suffix.lower() != ".wav":
            raise FileNotFoundError(
                f"Input file {task.input} is missing or not a WAV file."
            )
        if task.settings.asr_model is None:
            raise ValueError("ASR model is not set.")

        self.task = task
        self.timer = Timer()
        self.progress = WhisperRunning.model_validate(task)

        # run command
        self.proc: asyncio.subprocess.Process
        self.monitor: Monitor

    @classmethod
    async def run(cls, task: WhisperTaskInfo):
        self = cls(task)

        # run command
        self.proc = await asyncio.create_subprocess_exec(
            *self._command(),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

        self.monitor = Monitor(proc=self.proc, decoder=self._decoder)
        return self

    def resume(self):
        try:
            psutil.Process(self.proc.pid).resume()
            self.timer.resume()
        except psutil.NoSuchProcess:
            pass  # Process already terminated, nothing to resume

    def pause(self):
        try:
            psutil.Process(self.proc.pid).suspend()
            self.timer.suspend()
        except psutil.NoSuchProcess:
            pass  # Process already terminated, nothing to resume

    async def cancel(self, sig: str):
        await self.monitor.cancel(sig)
        self.proc.kill()
        await self.proc.wait()
        self.task.output.unlink(missing_ok=True)

    async def wait(self):
        try:
            await self.monitor.wait()
            self.task.input.unlink(missing_ok=True)
            await asyncio.to_thread(self._callback)
        except asyncio.CancelledError as e:
            await self.cancel(str(e))
            raise e
        except Exception as e:
            self.task.output.unlink(missing_ok=True)
            raise e

    def _command(self) -> list[str]:
        cmd = [
            "whisper-cli",
            "-m",
            str(self.task.settings.asr_model),
            "-np",
            "-pp",
            "-tp",
            str(self.task.settings.voice_temperature),
            "-osrt",
            "-l",
            self.task.subtitle,
            "-f",
            str(self.task.input),
            "-of",
            str(self.task.output.parent.resolve() / self.task.output.stem),
            "-ml",
            str(self.task.settings.max_length_segment),
            "-sow",
            "-nth",
            str(self.task.settings.no_speech_threshold),
            "-et",
            str(self.task.settings.entropy_thold),
            "-lpt",
            str(self.task.settings.logprob_thold),
            "-mc",
            str(self.task.settings.max_context),
            *(["-sns"] if self.task.settings.suppress_nst else []),
            *(["-nf"] if self.task.settings.no_fallback else []),
            *(
                [
                    "--vad",
                    "-vm",
                    str(self.task.settings.vad_model),
                    "-vmsd",
                    str(self.task.settings.voice_speech_duration),
                    "-vsd",
                    str(self.task.settings.voice_minimum_silence_duration),
                    "-vt",
                    str(self.task.settings.voice_threshold),
                ]
                if self.task.settings.vad_model is not None
                else []
            ),
        ]
        lg.debug(
            f"Initialized Whisper task: input: {self.task.input}; output: {self.task.output}; cmd: {' '.join(shlex.quote(arg) for arg in cmd)}"
        )
        return cmd

    def _decoder(self, line: str) -> None:
        if "=" in line and "whisper_print_progress_callback" in line:
            *_, raw_value = line.split("=")
            value = int(raw_value.strip().split("%")[0])
            self.progress.progress = value
        else:
            self.progress.log.append(line)

    def _callback(self) -> None:
        self.progress.log.append(
            f"Whisper task completed. Reviewing the output file: {self.task.output}"
        )

        index = 1
        timestamp = ""
        content = ""
        temp_file = self.task.output.with_suffix(".temp")
        with self.task.output.open("r", encoding="utf-8", errors="replace") as fin:
            with temp_file.open("w", encoding="utf-8") as fout:
                for line in fin:
                    if line.strip().isdigit():
                        pass
                    elif "-->" in line:
                        timestamp = line.strip()
                    elif line.strip() == "":
                        pass
                    else:
                        if line.strip() != content:
                            content = line.strip()
                            write = line.strip()
                            last_block = ""
                            while len(write) > 13:
                                best = self._find_repeat_block(write)
                                if best and best["block"] != last_block:
                                    last_block = best["block"]
                                    write = (
                                        best["prefix"]
                                        + best["block"]
                                        * min(
                                            3,
                                            max(
                                                1,
                                                (
                                                    13
                                                    - len(
                                                        best["prefix"] + best["suffix"]
                                                    )
                                                )
                                                // len(best["block"]),
                                            ),
                                        )
                                        + best["suffix"]
                                    )
                                else:
                                    self.progress.log.append(
                                        f"Fix subtitle: {line.strip()} --> {write}"
                                    )
                                    break

                            fout.write(f"{index}\n")
                            fout.write(f"{timestamp}\n")
                            fout.write(f"{write}\n\n")
                            index += 1

                        else:
                            self.progress.log.append(
                                f"Duplicate subtitle line detected and skipped: {timestamp} --> {line.strip()}"
                            )

        temp_file.replace(self.task.output)

    @staticmethod
    def _find_repeat_block(
        s: str,
        min_region_len: int = 3,
        max_block_len: int = 38,
    ):
        """
        Find:
            prefix + block * count + suffix

        Rules:
            1. Find the longest continuous repeated region.
            2. Inside the region, reduce to the smallest repeating unit.
            3. Ignore repeated regions shorter than min_region_len.

        Return:
            {
                "prefix": ...,
                "block": ...,
                "count": ...,
                "suffix": ...
            }
        """

        n = len(s)

        if n < min_region_len:
            return None

        best = None

        # Find the longest repeated region
        for start in range(n):

            for block_len in range(1, min(max_block_len, n - start) + 1):

                block = s[start : start + block_len]

                pos = start + block_len
                count = 1

                while pos + block_len <= n and s.startswith(block, pos):
                    count += 1
                    pos += block_len

                if count < 2:
                    continue

                region_len = pos - start

                if region_len < min_region_len:
                    continue

                if best is None or region_len > best["region_len"]:
                    best = {
                        "start": start,
                        "end": pos,
                        "region_len": region_len,
                    }

        if best is None:
            return None

        # Extract repeat region
        repeat_region = s[best["start"] : best["end"]]

        # Find smallest period
        block = repeat_region

        for size in range(1, len(repeat_region) + 1):

            if len(repeat_region) % size != 0:
                continue

            candidate = repeat_region[:size]

            if candidate * (len(repeat_region) // size) == repeat_region:
                block = candidate
                break

        return {
            "prefix": s[: best["start"]],
            "block": block,
            "count": len(repeat_region) // len(block),
            "suffix": s[best["end"] :],
        }
