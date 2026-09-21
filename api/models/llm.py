from pydantic import BaseModel, Field
from typing import Literal, Optional
from pathlib import Path
from datetime import datetime
from models.const import Language
from models.base import ApiRunningBase


class LLMTranslateArgs(BaseModel):
    original: Language
    destination: Language


class LLMTaskInfo(BaseModel):
    input: Path
    output: Path
    args: LLMTranslateArgs


class LLMSettings(BaseModel):
    llm_type: Literal["openai-api", "llama.cpp", "mlx"] = "openai-api"
    llm_key: Optional[str] = None
    max_tokens: int = Field(default=8000, ge=500, le=32000)
    max_input: int = Field(default=330, ge=30, le=8000)
    prompt: list[dict] = [
        {
            "role": "system",
            "content": "You are a professional and accurate translator.\n"
            "You will receive a multi-line text, and then tranlate it to the target language line-by-line.\n"
            "The multi-line text is provided for you to understand the context only.\n"
            "Do not infer or guess the meaning of the text.\n"
            "Start output the translation with a line 'Singal: yyytttqqq.'.",
        }
    ]
    temperature: float = Field(default=0.13, ge=0.0, le=2.0)


# Api
class LLMApiBase(BaseModel):
    type: Literal["llm"] = "llm"


class LLMWaiting(LLMTaskInfo):
    uid: int


class LLMRunning(LLMApiBase, LLMWaiting, ApiRunningBase):
    # Progress Info
    log: list[str] = []
    progress: float = Field(default=0.0, ge=0.0, le=100.0)


class LLMFailed(LLMApiBase):
    uid: int
    input: Path
    output: Path
    args: LLMTranslateArgs
    settings: LLMSettings
    error: list[str]
    time: datetime


class LLMCompleted(LLMApiBase):
    input: Path
    output: Path
    args: LLMTranslateArgs
    total_consumed: int
    finished_time: datetime
