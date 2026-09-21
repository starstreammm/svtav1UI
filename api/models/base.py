from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timedelta, timezone


class ApiRunningBase(BaseModel):
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    consumed_time: timedelta = timedelta(seconds=0)

    # Device Info
    cpu_usage: float = 0.0
    ram_usage: float = 0.0

    class Config:
        json_encoders = {timedelta: lambda td: str(td).split(".")[0]}

    @field_validator("progress", check_fields=False)
    @classmethod
    def validate_progress(cls, v):
        if not isinstance(v, (int, float)):
            return 0.0
        elif v < 0:
            return 0.0
        elif v > 100:
            return 100.0
        else:
            return round(v, 2)
