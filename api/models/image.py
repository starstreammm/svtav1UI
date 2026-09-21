from pydantic import BaseModel, Field
from typing import Literal
from pathlib import Path
from datetime import datetime, timedelta, timezone

from models.settings import TranscodeSettings
from models.base import ApiRunningBase


class ImageInfo(BaseModel):
    path: Path
    size: int
    width: int
    height: int
    sar: str
    pix_fmt: str
    color_space: str
    color_transfer: str
    color_primaries: str
    zscale: str
    sar_fix: str


class ImageETAInfo(BaseModel):
    pixel_count: list[int]
    cpu_used: int


class ImageTranscodeArgs(BaseModel):
    crf: int = Field(ge=-1, le=36)
    cpu_used: int = Field(ge=0, le=16)


class ImageTaskInfo(BaseModel):
    input: list[ImageInfo]
    output: Path
    args: ImageTranscodeArgs
    settings: TranscodeSettings


class ImageHistory(BaseModel):
    uid: int
    pixel_count: int
    cpu_used: int
    total_consumed: int


# Api
class ImageApiBase(BaseModel):
    type: Literal["image"] = "image"


class ImageWaiting(ImageApiBase, ImageTaskInfo):
    uid: int
    sort: float
    eta: ImageETAInfo
    retry: int = 0
    error: list[str] = []


class ImageRunningItem(ImageInfo):
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ImageErrorItem(ImageInfo):
    error: str


class ImageCompletedItem(BaseModel):
    input: ImageInfo
    output: ImageInfo
    consumed_time: timedelta

    class Config:
        json_encoders = {timedelta: lambda td: str(td).split(".")[0]}


class ImageRunning(ImageApiBase, ApiRunningBase):
    # Task Info
    uid: int
    output: Path
    args: ImageTranscodeArgs
    settings: TranscodeSettings

    # Progress Info
    pending: list[ImageInfo] = []
    completed: list[ImageCompletedItem] = []
    running: list[ImageRunningItem] = []
    error: list[ImageErrorItem] = []


class ImageFailed(ImageApiBase, ImageTaskInfo):
    uid: int
    error: list[str]
    time: datetime


class ImageCompleted(ImageApiBase):
    input: list[ImageInfo]
    output: list[ImageInfo]
    args: ImageTranscodeArgs
    total_consumed: str
    finished_time: datetime
