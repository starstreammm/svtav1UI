from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime
from models.whisper import WhisperSettings
from models.llm import LLMSettings


class TranscodeSettings(BaseModel):
    # General Settings
    overwrite: bool = False
    delete_source: bool = True
    retry: int = Field(default=3, ge=0, le=8)

    # Video Transcoder Settings
    preset: int = Field(default=6, ge=0, le=12)
    max_bitrate_mb: float = Field(default=88.8, ge=0.1, le=338)
    overshoot_pct: int = Field(default=100, ge=0, le=100)
    undershoot_pct: int = Field(default=10, ge=0, le=100)
    minsection_pct: int = Field(default=80, ge=0, le=100)
    maxsection_pct: int = Field(default=6000, ge=0, le=10000)
    keyint: str = "6s"
    lookahead: int = Field(default=120, ge=0, le=120)
    scd: bool = True

    # Image Transcoder Settings
    crf: int = Field(default=8, ge=-1, le=36)
    cpu_used: int = Field(default=3, ge=0, le=16)


class TranslatorSettings(WhisperSettings, LLMSettings):
    pass


# Schedule
class TaskSchedule(BaseModel):
    on: bool = False
    finish_time: datetime
    max_extend: int = 8  # in minutes
    sort: Literal["default", "longest", "shortest"] = "default"
    weight: Literal["size", "duration"] = "size"
