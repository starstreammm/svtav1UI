import shlex
import psutil
import asyncio
import json
from pathlib import Path
from datetime import datetime, timezone
from copy import deepcopy

from models import (
    ImageTranscodeArgs,
    ImageWaiting,
    ImageRunning,
    ImageRunningItem,
    ImageErrorItem,
    ImageCompletedItem,
    ImageInfo,
)
from utils import insert_waiting
from utils.logger import LoggerBase as lg
from utils.eta import ETA
from utils.timer import Timer
from utils.database import Database as db
from utils.task_info import TaskInfo


class Image:
    def __init__(self, task: ImageWaiting):
        if not task.output.is_dir():
            raise FileNotFoundError(
                f"Output directory {task.output} is missing or not a directory."
            )

        self.logic_cores = psutil.cpu_count() or 1
        self.task = task
        self.semaphore = asyncio.Semaphore(int(self.logic_cores / 6))
        self.timer = Timer()

        self.progress = ImageRunning.model_validate(task.model_dump(exclude={"error"}))
        self.progress.pending = deepcopy(task.input)

        self.worker: asyncio.Task = asyncio.create_task(self._worker())
        self.workers: list[_ImageWorker] = []
        self.callbacks: list[asyncio.Task] = []

    def get_progress(self):
        self.progress.consumed_time = self.timer.total()
        return self.progress

    def resume(self):
        self.timer.resume()
        for worker in self.workers:
            asyncio.create_task(worker.resume())

    def pause(self):
        self.timer.suspend()
        for worker in self.workers:
            asyncio.create_task(worker.pause())

    async def cancel(self, sig: str):
        self.worker.cancel(sig)
        await self.worker

    async def wait(self):
        await self.worker

    async def _worker(self):
        try:
            # run command for each file
            while self.progress.pending:
                await self.semaphore.acquire()
                file = self.progress.pending.pop(0)
                self.progress.running.append(
                    ImageRunningItem.model_validate(file.model_dump())
                )
                worker = _ImageWorker(
                    args=self.task.args,
                    file=file,
                    overwrite=self.task.settings.overwrite,
                    output=self.task.output,
                )
                self.workers.append(worker)
                self.callbacks.append(
                    asyncio.create_task(
                        self._callback(worker, self.task.settings.delete_source)
                    )
                )

            # wait for all workers to finish
            for cb in self.callbacks:
                await cb

        except asyncio.CancelledError as e:
            for worker in self.workers:
                try:
                    await worker.cancel(str(e))
                except asyncio.CancelledError:
                    pass
            await asyncio.gather(*self.callbacks, return_exceptions=True)

            if not str(e) == "task":
                completed_files = [f.input.path for f in self.progress.completed]
                self.task.input = [
                    f for f in self.task.input if f.path not in completed_files
                ]
                insert_waiting(self.task)
            raise e
        else:
            if len(self.progress.error) > 0:
                self._onFailed()
        finally:
            if len(self.progress.completed) > 0:
                self._onSuccess()

    async def _callback(self, task: _ImageWorker, delete_source: bool):
        try:
            await task.wait()
        except asyncio.CancelledError as e:
            raise e
        except Exception as e:
            lg.error(f"Image transcoding {task.file.path.name}: {e}")
            self.progress.error.append(
                ImageErrorItem(
                    **task.file.model_dump(),
                    error=str(e),
                )
            )
        else:
            output_info = await TaskInfo.run(task.output)
            self.progress.completed.append(
                ImageCompletedItem(
                    input=task.file,
                    output=output_info.response(),  # pyright: ignore
                    consumed_time=task.timer.total(),
                )
            )
            if delete_source:
                try:
                    task.file.path.unlink(missing_ok=True)
                    if len(list(task.file.path.parent.iterdir())) == 0:
                        task.file.path.parent.rmdir()
                except Exception as e:
                    lg.error(f"Failed to delete source file {task.file.path}: {e}")
        finally:
            self.semaphore.release()
            for i, w in enumerate(self.progress.running):
                if w.path == task.file.path:
                    self.progress.running.pop(i)
                    break

    def _onSuccess(self):
        db.execute(
            """
                INSERT INTO completed 
                (type, input, output, args, total_consumed, finished_time) 
                VALUES ('image', ?, ?, ?, ?, ?);
            """,
            json.dumps(
                [f.input.model_dump(mode="json") for f in self.progress.completed]
            ),
            json.dumps(
                [f.output.model_dump(mode="json") for f in self.progress.completed]
            ),
            self.task.args.model_dump_json(),
            str(self.timer.total()).split(".")[0],
            datetime.now(timezone.utc).isoformat(),
        )

    def _onFailed(self):
        self.task.retry += 1
        self.task.error += [f"{e.path.name}: {e.error}" for e in self.progress.error]
        self.task.input = [
            ImageInfo.model_validate(e.model_dump()) for e in self.progress.error
        ]

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


class _ImageWorker:
    def __init__(
        self,
        args: ImageTranscodeArgs,
        file: ImageInfo,
        overwrite: bool,
        output: Path,
    ):
        self.args = args
        self.file = file
        self.overwrite = overwrite
        self.output = output / f"{file.path.stem}.avif"
        self.worker = asyncio.create_task(self._worker())
        self.proc: asyncio.subprocess.Process
        self.timer = Timer()

    async def wait(self):
        await self.worker

    async def resume(self):
        if not self.worker.done():
            self.timer.resume()
            psutil.Process(self.proc.pid).resume()

    async def pause(self):
        if not self.worker.done():
            self.timer.suspend()
            psutil.Process(self.proc.pid).suspend()

    async def cancel(self, sig: str):
        self.worker.cancel(sig)
        await self.worker

    async def _worker(self):
        try:
            self.proc = await asyncio.create_subprocess_exec(
                *self._command(),
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.PIPE,
            )
            stderr, _ = await self.proc.communicate()
            stderr = stderr.decode(errors="ignore") if stderr else None

            if self.proc.returncode != 0:
                if not stderr:
                    error_message = "Unknown error occurred."
                else:
                    error_message = f"{self.file.path.name}: {stderr}"
                lg.error(
                    f"Process exited with code {self.proc.returncode}: {error_message}"
                )
                raise RuntimeError(f"Code {self.proc.returncode}: {error_message}")

            ETA.insert_image_history(
                self.file,
                self.args,
                int(self.timer.total().total_seconds()),
            )
        except asyncio.CancelledError as e:
            self.proc.kill()
            await self.proc.wait()
            self.output.unlink(missing_ok=True)
            raise e

    def _command(self) -> list[str]:
        filters = []

        # scale fix
        if self.file.sar_fix:
            filters.append(self.file.sar_fix)
        elif self.file.width % 2 != 0 or self.file.height % 2 != 0:
            filters.append("pad=ceil(iw/2)*2:ceil(ih/2)*2")

        # default filter
        filters.append("setsar=1")
        filters.append(self.file.zscale)
        filters.append(f"format={self.file.pix_fmt}")

        cmd = [
            "ffmpeg",
            "-v",
            "error",
            "-y" if self.overwrite else "-n",
            "-i",
            str(self.file.path.resolve()),
            "-c:v",
            "libaom-av1",
            "-crf",
            str(self.args.crf),
            "-cpu-used",
            str(self.args.cpu_used),
            "-still-picture",
            "1",
            "-vf",
            ",".join(filters),
            str(self.output.resolve()),
        ]

        lg.debug(f"Initialized Image task: {' '.join(shlex.quote(arg) for arg in cmd)}")
        return cmd
