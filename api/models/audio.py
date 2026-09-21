from pydantic import BaseModel
from typing import Literal
from pathlib import Path
from datetime import timedelta
from models.base import ApiRunningBase


# Api
class AudioApiBase(BaseModel):
    type: Literal["audio"] = "audio"


class AudioRunning(AudioApiBase, ApiRunningBase):
    # Task Info
    input: list[Path]
    output: Path
    total_duration: timedelta

    # Progress Info
    bitrate: str = ""
    size: str = ""
    completed_duration: timedelta = timedelta(seconds=0)
    dup_frames: int = 0
    drop_frames: int = 0
    speed: float = 0.0
    progress: float = 0.0
    eta: timedelta = timedelta(seconds=0)
