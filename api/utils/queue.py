import asyncio
import psutil
import json

from datetime import datetime, timezone, timedelta

from models import *
from utils.database import Database as db
from utils.logger import LoggerBase as lg
from utils.video import Video
from utils.llm import LLM
from utils.image import Image
from routes.settings import SettingsManager
from routes.plan import PlanUtils


class Queue:
    def __init__(self):
        self.queue = asyncio.create_task(self._loop())
        self.running: Image | Video | LLM | None = None
        self.is_running = True
        self.llm: asyncio.Task | None = None
        self.suspend_loop = asyncio.Event()
        self.suspend_loop.set()

    def progress(self):
        # Get progress data
        data = None
        if self.running is not None:
            data = self.running.get_progress()
        if data is None:
            return None

        # Update CPU and RAM usage
        cpu = psutil.cpu_percent()
        if cpu > 0:
            data.cpu_usage = cpu
        data.ram_usage = psutil.virtual_memory().percent

        return data

    def pause(self):
        self.suspend_loop.clear()

    def resume(self):
        self.suspend_loop.set()

    async def cancel(self, sig: str):
        self.queue.cancel(sig)
        try:
            await self.queue
        except asyncio.CancelledError:
            pass

    def pause_running(self):
        if self.running is not None:
            self.is_running = False
            if isinstance(self.running, LLM):
                raise RuntimeError("LLM is not pausable. Cannot pause LLM task.")
            else:
                self.running.pause()

    def resume_running(self):
        if self.running is not None:
            self.is_running = True
            if isinstance(self.running, LLM):
                raise RuntimeError("LLM is not resumable. Cannot resume LLM task.")
            else:
                self.running.resume()

    async def cancel_running(self):
        if self.running is not None:
            try:
                if isinstance(self.running, LLM):
                    raise RuntimeError("LLM is not cancelable. Cannot cancel LLM task.")
                else:
                    await self.running.cancel("task")
            except asyncio.CancelledError:
                pass

    async def _loop(self):
        while True:
            # Reset
            self.running = None
            self.is_running = True
            self.llm = None
            self.suspend_total = timedelta(0)

            # Wait for suspend to be cleared
            await self.suspend_loop.wait()

            # Get Task
            task = await self._preprocess()
            if task is None:
                if await SettingsManager.translator_check():
                    # Process LLM tasks if any
                    while db.fetchone("SELECT 1 FROM llm_waiting LIMIT 1;"):
                        self.running = LLM(SettingsManager._translator)
                        while True:
                            rtn = await self._llm_task()
                            if not rtn:
                                break
                    self.running = None

                # Continue to next iteration
                await asyncio.sleep(3)
                continue

            # Run Task
            try:
                if isinstance(task, ImageWaiting):
                    self.running = Image(task)
                    await self.running.wait()

                else:
                    self.running = Video.run(task)
                    await self.running.wait()

                    # Process LLM
                    if task.args.tran is not None:
                        if (
                            task.args.tran_inmediate
                            and SettingsManager.translator_check()
                        ):
                            self.running = LLM(SettingsManager._translator)
                            await self._llm_task(task)
                            self.running = None
                        else:
                            LLM.insert(LLM.tran_from_videotask(task))

            except asyncio.CancelledError as e:
                if str(e) == "task":
                    continue
                else:
                    raise e

            except Exception as e:
                lg.exception(f"Task failed: {e} -> {task.model_dump()}")
                continue

    async def _preprocess(self):
        try:
            task = await PlanUtils.get_next(self.pause)
        except Exception:
            return None
        else:
            return task

    async def _llm_task(self, task: LLMTaskInfo | VideoTaskInfo | None = None) -> bool:
        if isinstance(self.running, LLM):
            if task is None:
                row = db.fetchone("SELECT * FROM llm_waiting ORDER BY uid ASC LIMIT 1;")
                if row is None:
                    return False
                task = LLM.fetch_waiting(row)
                db.execute("DELETE FROM llm_waiting WHERE uid=?;", task.uid)

            elif isinstance(task, VideoTaskInfo):
                task = LLM.tran_from_videotask(task)

            try:
                self.llm = await self.running.run(task)
            except asyncio.CancelledError as e:
                LLM.insert(task)
                raise e
            except Exception as e:
                lg.exception(f"LLM task failed: {task.output} {e}")
                db.execute(
                    "INSERT INTO failed (input, output, args, error, time) VALUES (?, ?, ?, ?, ?);",
                    str(task.input.resolve()),
                    str(task.output.resolve()),
                    task.args.model_dump_json(),
                    json.dumps([str(e)], ensure_ascii=False),
                    datetime.now(timezone.utc).isoformat(),
                )
                return False
            else:
                return True

        else:
            lg.error("LLM is not running. Cannot process LLM task.")
            return False
