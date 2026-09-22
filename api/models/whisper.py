from pydantic import BaseModel, Field, model_validator
from typing import Optional, Literal
from pathlib import Path
from datetime import datetime
from models.base import ApiRunningBase
from models.const import Language


class WhisperSettings(BaseModel):
    # whisper settings
    asr_model: Optional[Path] = None
    max_length_segment: int = Field(default=38, ge=10, le=100)
    voice_temperature: float = Field(default=0.0, ge=0.0, le=1.0)
    no_speech_threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    entropy_thold: float = Field(default=2.3, ge=0.0, le=8.0)
    logprob_thold: float = Field(default=-1.0, ge=-8.0, le=0.0)
    max_context: int = Field(default=-1, ge=-1, le=5120)
    suppress_nst: bool = False
    no_fallback: bool = False

    # VAD settings
    vad_model: Optional[Path] = None
    voice_speech_duration: int = Field(default=30, ge=0, le=300)
    voice_minimum_silence_duration: int = Field(default=300, ge=0, le=1000)
    voice_threshold: float = Field(default=0.63, ge=0.0, le=1.0)


class WhisperTaskInfo(BaseModel):
    input: Path
    output: Path
    subtitle: Language
    settings: WhisperSettings

    @model_validator(mode="after")
    def validate_output(self):
        if not self.output.suffix.lower() == ".srt":
            self.output = self.output.with_suffix(f".{self.subtitle}.srt")
        return self


class WhisperApiBase(BaseModel):
    type: Literal["whisper"] = "whisper"


class WhisperRunning(WhisperApiBase, WhisperTaskInfo, ApiRunningBase):
    log: list[str] = []
    progress: float = Field(default=0.0, ge=0.0, le=100.0)


class WhisperCompleted(WhisperApiBase):
    input: list[Path]
    output: Path
    args: Language
    total_consumed: str
    finished_time: datetime
