from fastapi import APIRouter, Query, HTTPException
from pathlib import Path
from pypinyin import lazy_pinyin
from natsort import natsorted

from models import ApiPath, VideoSuffixs, ImageSuffixs
from utils.logger import LoggerBase as lg

path_router = APIRouter(prefix="/path", tags=["Path"])


@path_router.get("/home", response_model=str)
async def get_home_path():
    """
    Get the home directory path.
    """
    return str(Path.home().resolve())


@path_router.get("/ls", response_model=ApiPath)
async def list_directory(
    path: Path = Query(..., description="Directory path to list"),
    filter: str = Query(
        "video",
        description="Type of files to list: 'video', 'model' or 'subtitle'. Use space to separate multiple types, e.g., 'video model'.",
    ),
):
    if not path.exists():
        raise HTTPException(400, "Invalid path or path not found")
    if not path.is_dir():
        return ApiPath(dir=[], file=[])
    dir: list[str] = []
    file: list[str] = []
    for p in path.iterdir():
        if p.name.startswith("."):
            continue
        if p.is_dir():
            dir.append(p.name)
        else:
            if "video" in filter and p.suffix.lower() in VideoSuffixs:
                file.append(p.name)
            if "image" in filter and p.suffix.lower() in ImageSuffixs:
                file.append(p.name)
            if "model" in filter and p.suffix.lower() in [".bin"]:
                file.append(p.name)
            if "subtitle" in filter and p.suffix.lower() in [".srt"]:
                file.append(p.name)
    return ApiPath(
        dir=natsorted(dir, key=lambda x: lazy_pinyin(x)),
        file=natsorted(file, key=lambda x: lazy_pinyin(x)),
    )


@path_router.get("/mkdir", response_model=None)
async def mkdir_path(path: Path = Query(..., description="Directory path to create")):
    path.mkdir(parents=True, exist_ok=True)
    lg.debug(f"Created directory: {path.resolve()}")


@path_router.get("/is_file", response_model=bool)
async def is_file_path(path: Path = Query(..., description="Path to check")):
    if not path.exists():
        raise HTTPException(400, "Invalid path")
    else:
        return path.is_file()
