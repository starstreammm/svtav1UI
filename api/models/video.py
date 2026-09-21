from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from pathlib import Path
from datetime import datetime, timedelta

from models.const import CODEC_ID, Language
from models.settings import TranscodeSettings
from models.base import ApiRunningBase


class VideoInfo(BaseModel):
    path: Path
    size: int
    codec: str
    width: int
    height: int
    sar: str
    pix_fmt: str
    color_space: str
    color_transfer: str
    color_primaries: str
    bit_rate: int
    frame_rate: float
    duration: float
    audio_bit_rate: int

    model_config = {"json_encoders": {Path: lambda p: str(p.resolve())}}

    @field_validator("audio_bit_rate")
    def validate_audio_bit_rate(cls, v):
        if not isinstance(v, int):
            return 128000
        elif v > 256000:
            return 256000
        elif v < 128000 and v > 0:
            return 128000
        else:
            return v


class VideoETAInfo(BaseModel):
    codec: int
    pixel_count: int
    frame_count: int
    subtitle: bool = False

    preset: int
    target_bit_rate: int
    lookahead: int
    keyint: int  # frame count
    scd: bool

    @field_validator("codec")
    def validate_codec(cls, v):
        if isinstance(v, str):
            v = CODEC_ID.get(v, -1)
        return v


class VideoTranscodeArgs(BaseModel):
    pix_fmt: str
    zscale: str
    sar_fix: str = ""
    video_br: int
    audio_br: int
    rotate: Optional[int] = Field(default=None, ge=0, le=6)
    subtitle: Optional[Language] = None
    tran: Optional[Language] = None
    tran_inmediate: bool = False


class VideoTaskInfo(BaseModel):
    input: list[VideoInfo]
    output: Path
    args: VideoTranscodeArgs
    settings: TranscodeSettings


class VideoHistory(VideoETAInfo):
    total_consumed: int


# Api
class VideoApiBase(BaseModel):
    type: Literal["video"] = "video"


class VideoWaiting(VideoApiBase, VideoTaskInfo):
    uid: int
    sort: float
    eta: VideoETAInfo
    retry: int = 0
    error: list[str] = []


class VideoRunning(VideoApiBase, VideoTaskInfo, ApiRunningBase):
    # Task Info
    uid: int
    total_duration: timedelta
    retry: int

    # Progress Info
    frame: int = 0
    fps: float = 0.0
    qp: float = 0.0
    bitrate: str = ""
    size: str = ""
    completed_duration: timedelta = timedelta(seconds=0)
    dup_frames: int = 0
    drop_frames: int = 0
    speed: float = 0.0
    progress: float = 0.0
    eta: timedelta = timedelta(seconds=0)


class VideoFailed(VideoApiBase, VideoTaskInfo):
    uid: int
    error: list[str]
    time: datetime


class VideoCompleted(VideoApiBase):
    input: list[VideoInfo]
    output: VideoInfo
    args: VideoTranscodeArgs
    total_consumed: str
    finished_time: datetime
