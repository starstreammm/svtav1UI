import json
from pathlib import Path
from pydantic_core import ValidationError

from utils.eta import ETA
from utils.database import Database as db
from models import (
    VideoTaskInfo,
    ImageTaskInfo,
    VideoWaiting,
    ImageWaiting,
    VideoETAInfo,
    ImageETAInfo,
    VideoInfo,
    ImageInfo,
    VideoTranscodeArgs,
    ImageTranscodeArgs,
    TranscodeSettings,
    ApiWaiting,
)


def fetch_task(row) -> ImageTaskInfo | VideoTaskInfo:
    try:
        return ImageTaskInfo(
            input=[ImageInfo.model_validate(f) for f in json.loads(row["input"])],
            output=Path(row["output"]),
            args=ImageTranscodeArgs.model_validate_json(row["args"]),
            settings=TranscodeSettings.model_validate_json(row["settings"]),
        )
    except ValidationError:
        return VideoTaskInfo(
            input=[VideoInfo.model_validate(f) for f in json.loads(row["input"])],
            output=Path(row["output"]),
            args=VideoTranscodeArgs.model_validate_json(row["args"]),
            settings=TranscodeSettings.model_validate_json(row["settings"]),
        )


def fetch_ApiWaiting(row) -> ApiWaiting:
    task_info = fetch_task(row)
    if isinstance(task_info, ImageTaskInfo):
        return ImageWaiting(
            **task_info.model_dump(),
            uid=row["uid"],
            sort=row["sort"],
            eta=ImageETAInfo.model_validate_json(row["eta"]),
            error=json.loads(row["error"]),
        )
    else:
        return VideoWaiting(
            **task_info.model_dump(),
            uid=row["uid"],
            sort=row["sort"],
            eta=VideoETAInfo.model_validate_json(row["eta"]),
            retry=row["retry"],
            error=json.loads(row["error"]),
        )


def insert_waiting(
    task: ApiWaiting | VideoTaskInfo | ImageTaskInfo,
    priority: bool = False,
) -> int:
    if not all(f.path.is_file() for f in task.input):
        raise FileNotFoundError("One or more input files are missing.")

    sort = (
        getattr(task, "sort")
        if hasattr(task, "sort")
        else (
            (((db.fetchone("SELECT MIN(sort) FROM waiting;"))[0] or 0) - 1000)
            if priority
            else (((db.fetchone("SELECT MAX(sort) FROM waiting;"))[0] or 0) + 1000)
        )
    )

    uid = (
        db.fetchone(
            f"""
                    INSERT INTO waiting
                    ({'uid, ' if hasattr(task, 'uid') else ''}sort, eta, input, output, args, settings, retry, error)
                    VALUES ({str(getattr(task, 'uid')) + ', ' if hasattr(task, 'uid') else ''}?, ?, ?, ?, ?, ?, ?, ?)
                    RETURNING uid;
                """,
            sort,
            (
                task.eta.model_dump_json()
                if isinstance(task, VideoWaiting | ImageWaiting)
                else ETA.get_info(task).model_dump_json()
            ),
            json.dumps(
                [f.model_dump(mode="json") for f in task.input],
                ensure_ascii=False,
            ),
            str(task.output.resolve()),
            task.args.model_dump_json(),
            task.settings.model_dump_json(),
            getattr(task, "retry", 0),
            json.dumps(getattr(task, "error", []), ensure_ascii=False),
        )
    )[0]
    return uid
