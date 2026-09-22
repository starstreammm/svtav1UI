import shlex
import asyncio
import os
import psutil
import json
from datetime import datetime, timezone, timedelta

from models import *
from utils import insert_waiting
from utils.database import Database as db
from utils.logger import LoggerBase as lg
from utils.monitor import Monitor
from utils.timer import Timer
from utils.whisper import Whisper
from utils.eta import ETA
from utils.audio import Audio
from utils.task_info import TaskInfo
from routes.settings import SettingsManager

# Environment variables for subprocess
ENV = os.environ.copy()
ENV["SVT_LOG"] = "2"


class Video:
    def __init__(self, task: VideoWaiting):
        self.task = task
        self.timer = Timer()

        # process
        self.worker = asyncio.create_task(self._worker())
        self.audio: Audio | None = None
        self.transcode: Transcode | None = None
        self.whisper: Whisper | None = None

    @classmethod
    def run(cls, task: VideoWaiting):
        self = cls(task)
        return self

    def resume(self):
        self.timer.resume()
        if self.audio is not None:
            self.audio.resume()
        if self.transcode is not None:
            self.transcode.resume()
        if self.whisper is not None:
            self.whisper.resume()

    def pause(self):
        self.timer.suspend()
        if self.audio is not None:
            self.audio.pause()
        if self.transcode is not None:
            self.transcode.pause()
        if self.whisper is not None:
            self.whisper.pause()

    async def cancel(self, sig: str):
        if self.audio is not None:
            asyncio.create_task(self.audio.cancel(sig))
        if self.transcode is not None:
            asyncio.create_task(self.transcode.cancel(sig))
        if self.whisper is not None:
            asyncio.create_task(self.whisper.cancel(sig))
        await self.worker

    def get_progress(self):
        if self.transcode is not None:
            self.transcode.progress.consumed_time = self.transcode.timer.total()
            if self.whisper is not None:
                self.whisper.progress.log.clear()
            return self.transcode.progress
        elif self.whisper is not None:
            self.whisper.progress.consumed_time = self.whisper.timer.total()
            res = self.whisper.progress.model_copy(deep=True)
            self.whisper.progress.log.clear()
            return res
        elif self.audio is not None:
            self.audio.progress.consumed_time = self.audio.timer.total()
            return self.audio.progress
        else:
            return None

    async def wait(self):
        await self.worker

    async def _worker(self):
        try:
            if self.task.args.subtitle:
                self.audio = await Audio.run(self.task)
                await self.audio.wait()

            if self.task.args.video_br > 0:
                self.transcode = await Transcode.run(self.task)

            if self.task.args.subtitle:
                if self.audio is None:
                    raise ValueError("Audio is not initialized.")
                self.whisper = await Whisper.run(
                    WhisperTaskInfo(
                        input=self.audio.output,
                        output=self.task.output,
                        subtitle=self.task.args.subtitle,
                        settings=SettingsManager._translator,
                    )
                )

            if self.transcode is not None:
                await self.transcode.wait()
            if self.whisper is not None:
                await self.whisper.wait()

        except asyncio.CancelledError as e:
            if not str(e) == "task":
                self._onFailed()
            raise e

        except Exception as e:
            lg.error(f"Video task failed: {e}")
            self._onFailed(str(e))
            raise e

        else:
            await self._onSuccess()

    async def _onSuccess(self):
        if self.task.settings.delete_source and self.task.args.video_br > 0:
            for f in self.task.input:
                try:
                    f.path.unlink()
                    if len(list(f.path.parent.iterdir())) == 0:
                        f.path.parent.rmdir()
                except Exception as e:
                    lg.error(f"Failed to delete {f.path.resolve()}: {e}")

        if self.transcode is not None:
            output_info = await TaskInfo.run(self.task.output)

            db.execute(
                """
                    INSERT INTO completed 
                    (type, input, output, args, total_consumed, finished_time) 
                    VALUES ('video', ?, ?, ?, ?, ?);
                """,
                json.dumps([f.model_dump(mode="json") for f in self.task.input]),
                output_info.info.model_dump_json(),
                self.task.args.model_dump_json(),
                str(self.timer.total()).split(".")[0],
                datetime.now(timezone.utc).isoformat(),
            )
            ETA.insert_video_history(
                self.task.eta,
                int(self.transcode.timer.total().total_seconds()),
            )

        elif self.whisper is not None:
            db.execute(
                """
                    INSERT INTO completed 
                    (type, input, output, args, total_consumed, finished_time) 
                    VALUES ('whisper', ?, ?, ?, ?, ?);
                """,
                json.dumps([str(f.path.resolve()) for f in self.task.input]),
                str(self.whisper.task.output.resolve()),
                self.whisper.task.subtitle,
                str(self.timer.total()).split(".")[0],
                datetime.now(timezone.utc).isoformat(),
            )

    def _onFailed(self, error: str | None = None):
        if error is not None:
            self.task.retry += 1
            self.task.error.append(error)

        if self.task.retry < self.task.settings.retry:
            insert_waiting(self.task)

        else:
            db.execute(
                """
                    INSERT INTO failed 
                    (input, output, args, settings, error, time) 
                    VALUES (?, ?, ?, ?, ?, ?);
                """,
                json.dumps([f.model_dump(mode="json") for f in self.task.input]),
                str(self.task.output),
                self.task.args.model_dump_json(),
                self.task.settings.model_dump_json(),
                json.dumps(self.task.error),
                datetime.now(timezone.utc).isoformat(),
            )


class Transcode:
    def __init__(self, task: VideoWaiting):
        # init & validate task
        if task.args.video_br == -1:
            raise ValueError("Video bitrate is not set.")
        if (not task.settings.overwrite) and task.output.exists():
            raise FileExistsError(f"Output file {task.output} already exists.")
        if task.input[0].codec == "av1":
            lg.warning(
                f"Input file {task.input[0].path} is already AV1 encoded. Transcoding may not be necessary."
            )

        self.task = task
        self.total_duration = sum(f.duration for f in task.input)
        self.progress = VideoRunning(
            uid=task.uid,
            input=task.input,
            output=task.output,
            args=task.args,
            settings=task.settings,
            retry=task.retry,
            total_duration=timedelta(seconds=self.total_duration),
        )
        self.timer = Timer()

        # run command
        self.proc: asyncio.subprocess.Process
        self.monitor: Monitor

    @classmethod
    async def run(cls, task: VideoWaiting):
        self = cls(task)

        # run command
        self.proc = await asyncio.create_subprocess_exec(
            *self._command(),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=ENV,
        )
        self.monitor = Monitor(proc=self.proc, decoder=self._decoder)
        return self

    def resume(self):
        self.timer.resume()
        psutil.Process(self.proc.pid).resume()

    def pause(self):
        self.timer.suspend()
        psutil.Process(self.proc.pid).suspend()

    async def cancel(self, sig: str):
        await self.monitor.cancel(sig)
        self.proc.kill()
        await self.proc.wait()
        self.task.output.unlink(missing_ok=True)

    async def wait(self):
        try:
            await self.monitor.wait()
        except asyncio.CancelledError as e:
            await self.cancel(str(e))
            raise e
        except Exception as e:
            self.task.output.unlink(missing_ok=True)
            raise e

    def _filter(self) -> list[str]:
        filters = []

        # scale fix
        if self.task.args.sar_fix:
            filters.append(self.task.args.sar_fix)
        elif self.task.input[0].width % 2 != 0 or self.task.input[0].height % 2 != 0:
            filters.append("pad=ceil(iw/2)*2:ceil(ih/2)*2")

        # rotate
        if self.task.args.rotate:
            if self.task.args.rotate in range(0, 4):
                filters.append(f"transpose={self.task.args.rotate}")
            elif self.task.args.rotate == 4:
                filters.append("hflip")
            elif self.task.args.rotate == 5:
                filters.append("hflip,transpose=2,transpose=2")
            elif self.task.args.rotate == 6:
                filters.append("transpose=2,transpose=2")

        # default filter
        filters.append("setsar=1")
        filters.append(self.task.args.zscale)
        filters.append(f"format={self.task.args.pix_fmt}")

        audios = []
        for i, f in enumerate(self.task.input):
            if f.audio_bit_rate > 0:
                audios.append(
                    f"[{i}:a:0]"
                    "aformat=sample_rates=48000:channel_layouts=stereo,"
                    "aresample=async=1:first_pts=0"
                    f"[audio{i}];"
                )
            else:
                audios.append(f"anullsrc=r=48000:cl=stereo:d={f.duration}[audio{i}];")

        return [
            "-filter_complex",
            f"{''.join(audios)}"
            f"{''.join(f"[{i}:v:0][audio{i}]" for i in range(len(self.task.input)))}"
            f"concat=n={len(self.task.input)}:v=1:a=1[outv][outa];"
            f"[outv]{','.join(filters)}[v]",
            "-map",
            "[v]",
            "-map",
            "[outa]",
        ]

    def _command(self) -> list[str]:
        cmd = [
            "ffmpeg",
            "-v",
            "error",
            "-progress",
            "pipe:1",
            "-y" if self.task.settings.overwrite else "-n",
            *[arg for f in self.task.input for arg in ("-i", str(f.path.resolve()))],
            *self._filter(),
            "-c:v",
            "libsvtav1",
            "-b:v",
            str(
                min(
                    self.task.args.video_br,
                    self.task.settings.max_bitrate_mb * 1000 * 1000,
                )
            ),
            "-threads",
            "0",
            "-svtav1-params",
            f"rc=1:overshoot-pct={self.task.settings.overshoot_pct}"
            f":undershoot-pct={self.task.settings.undershoot_pct}"
            f":minsection-pct={self.task.settings.minsection_pct}"
            f":maxsection-pct={self.task.settings.maxsection_pct}"
            f":keyint={self.task.settings.keyint}"
            f":lookahead={self.task.settings.lookahead}"
            f":scd={int(self.task.settings.scd)}",
            "-preset",
            str(self.task.settings.preset),
            "-movflags",
            "+faststart",
            "-pix_fmt",
            self.task.args.pix_fmt,
            "-c:a",
            "aac",
            "-b:a",
            str(self.task.args.audio_br),
            str(self.task.output.resolve()),
        ]

        lg.debug(f"Initialized Video task: {' '.join(shlex.quote(arg) for arg in cmd)}")
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
        elif key == "frame":
            self.progress.frame = int(value)
        elif key == "fps":
            self.progress.fps = float(value)
        elif key == "stream_0_0_q":
            self.progress.qp = float(value)
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
