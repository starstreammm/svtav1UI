import uuid
import asyncio
import psutil
import shlex
from datetime import timedelta

from utils.timer import Timer
from models import VideoSuffixs, AudioRunning, DATA_PATH, VideoTaskInfo
from utils.monitor import Monitor
from utils.logger import LoggerBase as lg

TEMP_PATH = DATA_PATH / "temp"
TEMP_PATH.mkdir(parents=True, exist_ok=True)


class Audio:

    def __init__(self, task: VideoTaskInfo):
        # init & validate the file
        self.inputs = [t.path for t in task.input]
        self.uuid = uuid.uuid4().hex
        self.output = TEMP_PATH / f"{self.uuid}.wav"
        self.total_duration = sum(f.duration for f in task.input)
        self.timer = Timer()
        self.progress = AudioRunning(
            input=self.inputs,
            output=self.output,
            total_duration=timedelta(seconds=self.total_duration),
        )

        if not all(
            f.is_file() and f.suffix.lower() in VideoSuffixs for f in self.inputs
        ):
            raise FileNotFoundError(
                "One or more input files are missing or not supported video formats."
            )

        # run command
        self.proc: asyncio.subprocess.Process
        self.psutil_proc: psutil.Process
        self.monitor: Monitor

    @classmethod
    async def run(cls, task: VideoTaskInfo):
        self = cls(task)

        # run command
        self.proc = await asyncio.create_subprocess_exec(
            *self._command(),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        self.psutil_proc = psutil.Process(self.proc.pid)
        self.monitor = Monitor(proc=self.proc, decoder=self._decoder)
        return self

    def resume(self):
        try:
            self.psutil_proc.resume()
        except psutil.NoSuchProcess:
            pass
        else:
            self.timer.resume()

    def pause(self):
        try:
            self.psutil_proc.suspend()
        except psutil.NoSuchProcess:
            pass
        else:
            self.timer.suspend()

    async def cancel(self, sig: str):
        await self.monitor.cancel(sig)
        self.proc.kill()
        await self.proc.wait()
        self.output.unlink(missing_ok=True)

    async def wait(self):
        try:
            await self.monitor.wait()
        except asyncio.CancelledError as e:
            await self.cancel(str(e))
            raise e
        except Exception as e:
            self.output.unlink(missing_ok=True)
            raise e

    def _filter(self) -> list[str]:
        return [
            "-filter_complex",
            f"{''.join(f"[{i}:a:0]" for i in range(len(self.inputs)))}"
            f"concat=n={len(self.inputs)}:v=0:a=1[outa]",
            "-map",
            "[outa]",
        ]

    def _command(self) -> list[str]:
        # Build the command to extract audio from the video file
        cmd = [
            "ffmpeg",
            "-v",
            "quiet",
            "-progress",
            "pipe:1",
            "-y",
            *[arg for f in self.inputs for arg in ("-i", str(f.resolve()))],
            *self._filter(),
            "-ar",
            "16000",
            "-ac",
            "1",
            "-c:a",
            "pcm_s16le",
            str(self.output),
        ]

        lg.debug(
            f"Initialized Audio task: input: {self.inputs}; output: {self.output}; cmd: {' '.join(shlex.quote(arg) for arg in cmd)}"
        )
        return cmd

    def _decoder(self, raw_line: str) -> None:
        # decode & validation
        line = raw_line.split("=")
        if len(line) != 2:
            return
        key, value = line

        # update progress
        if value == "N/A":
            if self.progress.progress > 10:
                self.progress.progress = 100.0
                self.progress.eta = timedelta(seconds=0)
                return
        elif key == "bitrate":
            self.progress.bitrate = value
        elif key == "total_size":
            self.progress.size = (
                f"{int(value)/1024:.2f} KB"
                if int(value) < 1024**2
                else f"{int(value)/1024**2:.2f} MB"
            )
        elif key == "out_time_us":
            self.progress.completed_duration = timedelta(microseconds=int(value))
            self.progress.progress = (
                (
                    self.progress.completed_duration.total_seconds()
                    / self.total_duration
                    * 100
                )
                if self.progress.progress < 100
                else 100.0
            )
            self.progress.eta = timedelta(
                seconds=(
                    round(
                        (
                            self.total_duration
                            - self.progress.completed_duration.total_seconds()
                        )
                        / self.progress.speed
                    )
                    if self.progress.speed > 0
                    else 0
                )
            )
        elif key == "dup_frames":
            self.progress.dup_frames = int(value)
        elif key == "drop_frames":
            self.progress.drop_frames = int(value)
        elif key == "speed":
            self.progress.speed = float(value.replace("x", ""))
