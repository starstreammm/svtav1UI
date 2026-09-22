import json

from fastapi import APIRouter, Query, Request
from datetime import datetime

from models import *
from utils import insert_waiting, fetch_ApiWaiting, fetch_task
from utils.database import Database as db
from utils.logger import LoggerBase as lg
from utils.task_info import TaskInfo, VideoTaskSpwanResponse
from utils.llm import LLM

task_router = APIRouter(prefix="/task", tags=["task"])


# Task spawn
@task_router.get("/spawn", response_model=VideoTaskSpwanResponse | ImageInfo)
async def spawn_task(
    path: Path = Query(
        ..., description="The path of the video or image file to spawn a task for"
    )
):
    if not path.is_file():
        raise FileNotFoundError(f"File {path} does not exist.")

    task = await TaskInfo.run(path)
    return task.response()


@task_router.post("/spwan/multi", response_model=VideoTranscodeArgs)
async def spawn_multi_task(infos: list[VideoInfo]):
    """
    Spawn a multi-video transcoding task.
    """
    if not infos:
        raise ValueError("No video info provided.")

    return TaskInfo.fetch_multivideo_args(infos)


@task_router.post("/submit", response_model=None)
async def submit_task(
    task: VideoTaskInfo | ImageTaskInfo,
    update: int | None = Query(
        None, description="Whether to update an existing task if uid is provided"
    ),
    priority: bool = Query(
        False, description="Whether to add the task to the top of the waiting queue"
    ),
):
    """
    Submit a new transcoding task or update an existing one if uid is provided.
    Only settings & output can be updated.
    """
    if update is not None:
        db.execute(
            "UPDATE waiting SET settings=?, output=? WHERE uid=?;",
            task.settings.model_dump_json(),
            str(task.output.resolve()),
            update,
        )
    else:
        lg.info(f"Insert Task: {task.model_dump(mode="json")}")
        insert_waiting(task, priority=priority)


@task_router.post("/submit/llm", response_model=None)
async def submit_llm_task(task: LLMTaskInfo):
    """
    Submit a new LLM task.
    """
    lg.info(f"Insert LLM Task: {task.model_dump(mode="json")}")
    LLM.insert(task)


# Running
@task_router.get("/running", response_model=ApiRunning | None)
async def get_progress(r: Request):
    return r.app.state.queue.progress()


@task_router.post("/running/cancel", response_model=None)
async def stop_transcoding(r: Request):
    await r.app.state.queue.cancel_running()


@task_router.get("/running/pause", response_model=bool)
async def is_pause_transcoding(r: Request):
    return r.app.state.queue.is_running


@task_router.post("/running/pause", response_model=bool)
async def pause_transcoding(
    r: Request,
    set: bool = Query(description="True to resume, False to pause."),
):
    if set:
        r.app.state.queue.resume_running()
    else:
        r.app.state.queue.pause_running()

    return r.app.state.queue.is_running


# Waiting
@task_router.get("/waiting/llm", response_model=list[LLMWaiting])
async def get_llm_tasks():
    tasks: list[LLMTaskInfo] = []
    rows = db.fetchall("SELECT * FROM llm_waiting;")
    for row in rows:
        tasks.append(LLM.fetch_waiting(row))
    return tasks


@task_router.post("/waiting/llm/delete", response_model=None)
async def delete_llm_task(
    uid: int = Query(..., description="The uid of the waiting task to delete")
):
    db.execute("DELETE FROM llm_waiting WHERE uid=?;", uid)


@task_router.get("/waiting", response_model=list[ApiWaiting])
async def get_waiting():
    tasks: list[ApiWaiting] = []
    rows = db.fetchall("SELECT * FROM waiting;")
    for row in rows:
        tasks.append(fetch_ApiWaiting(row))
    return sorted(tasks, key=lambda t: t.sort)


@task_router.post("/waiting/sort", response_model=None)
async def sort_waiting(data: ApiSort):
    if data.last:
        last = (db.fetchone("SELECT sort FROM waiting WHERE uid=?;", data.last))[0]
    else:
        last = 0
    if data.next:
        next = (db.fetchone("SELECT sort FROM waiting WHERE uid=?;", data.next))[0]
    else:
        next = ((db.fetchone("SELECT MAX(sort) FROM waiting;"))[0] or 0) + 2000

    db.execute(
        """
        UPDATE waiting
        SET sort = ?
        WHERE uid = ?;
        """,
        (last + next) / 2,
        data.uid,
    )


@task_router.post("/waiting/delete", response_model=None)
async def delete_waiting(
    uid: int = Query(..., description="The uid of the waiting task to delete")
):
    db.execute("DELETE FROM waiting WHERE uid=?;", uid)


# Failed
@task_router.get("/failed", response_model=list[ApiFailed])
async def get_failed():
    tasks: list[ApiFailed] = []
    rows = db.fetchall("SELECT * FROM failed;")
    for row in rows:
        if row["settings"]:
            task = fetch_task(row)
            if isinstance(task, VideoTaskInfo):
                tasks.append(
                    VideoFailed(
                        **task.model_dump(),
                        uid=row["uid"],
                        error=json.loads(row["error"]),
                        time=datetime.fromisoformat(row["time"]),
                    )
                )
            else:
                tasks.append(
                    ImageFailed(
                        **task.model_dump(),
                        uid=row["uid"],
                        error=json.loads(row["error"]),
                        time=datetime.fromisoformat(row["time"]),
                    )
                )

        else:
            data = dict(row)
            data["error"] = json.loads(row["error"])
            data["args"] = LLMTranslateArgs.model_validate_json(row["args"])
            tasks.append(LLMFailed.model_validate(data))

    tasks.reverse()
    return tasks


@task_router.post("/failed/delete", response_model=None)
async def retry_task(
    uid: int = Query(..., description="The uid of the failed task to delete")
):
    db.execute("DELETE FROM failed WHERE uid=?;", uid)


@task_router.post("/failed/clear", response_model=None)
async def clear_failed():
    db.execute("DELETE FROM failed;")


# Completed
@task_router.get("/completed", response_model=list[ApiCompleted])
async def get_completed():
    tasks: list[ApiCompleted] = []
    rows = db.fetchall("SELECT * FROM completed;")
    for row in rows:
        if row["type"] == "video":
            tasks.append(
                VideoCompleted(
                    input=[
                        VideoInfo.model_validate(f) for f in json.loads(row["input"])
                    ],
                    output=VideoInfo.model_validate_json(row["output"]),
                    args=VideoTranscodeArgs.model_validate_json(row["args"]),
                    total_consumed=row["total_consumed"],
                    finished_time=datetime.fromisoformat(row["finished_time"]),
                )
            )
        elif row["type"] == "image":
            tasks.append(
                ImageCompleted(
                    input=[
                        ImageInfo.model_validate(f) for f in json.loads(row["input"])
                    ],
                    output=[
                        ImageInfo.model_validate(f) for f in json.loads(row["output"])
                    ],
                    args=ImageTranscodeArgs.model_validate_json(row["args"]),
                    total_consumed=row["total_consumed"],
                    finished_time=datetime.fromisoformat(row["finished_time"]),
                )
            )
        elif row["type"] == "whisper":
            tasks.append(
                WhisperCompleted(
                    input=[Path(f) for f in json.loads(row["input"])],
                    output=Path(row["output"]),
                    args=row["args"],
                    total_consumed=row["total_consumed"],
                    finished_time=datetime.fromisoformat(row["finished_time"]),
                )
            )
        else:
            tasks.append(
                LLMCompleted(
                    input=Path(row["input"]),
                    output=Path(row["output"]),
                    args=LLMTranslateArgs.model_validate_json(row["args"]),
                    total_consumed=row["total_consumed"],
                    finished_time=datetime.fromisoformat(row["finished_time"]),
                )
            )

    return sorted(tasks, key=lambda t: t.finished_time, reverse=True)


@task_router.post("/completed/clear", response_model=None)
async def clear_completed():
    db.execute("DELETE FROM completed;")


# Transcode cron Status
@task_router.post("/status", response_model=None)
async def pause_next_transcoding(
    r: Request,
    set: bool = Query(..., description="True to pause, False to resume the loop."),
):
    if set:
        r.app.state.queue.resume()
    else:
        r.app.state.queue.pause()


@task_router.get("/status", response_model=bool)
async def get_status(r: Request):
    return r.app.state.queue.suspend_loop.is_set()
