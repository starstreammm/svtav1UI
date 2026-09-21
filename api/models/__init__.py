from typing import Annotated, Union

from models.audio import *
from models.video import *
from models.image import *
from models.const import *
from models.llm import *
from models.whisper import *
from models.settings import *

ApiRunning = Annotated[
    Union[VideoRunning, ImageRunning, AudioRunning, LLMRunning, WhisperRunning],
    Field(discriminator="type"),
]

ApiWaiting = Annotated[
    Union[VideoWaiting, ImageWaiting],
    Field(discriminator="type"),
]

ApiCompleted = Annotated[
    Union[VideoCompleted, ImageCompleted, WhisperCompleted, LLMCompleted],
    Field(discriminator="type"),
]

ApiFailed = Annotated[
    Union[VideoFailed, ImageFailed, LLMFailed],
    Field(discriminator="type"),
]


# Api
class ApiPath(BaseModel):
    dir: list[str]
    file: list[str]


class ApiSort(BaseModel):
    uid: int
    last: Optional[int] = None
    next: Optional[int] = None
