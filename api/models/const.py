from typing import Literal
from pathlib import Path

# Constants
VERSION = "4.0.2"

ImageSuffixs = [
    ".jpg",
    ".jpeg",
    ".jp2",
    ".j2k",
    ".jxl",
    ".png",
    ".bmp",
    ".gif",
    ".tif",
    ".tiff",
    ".webp",
    ".heic",
    ".heif",
    ".avif",
]

VideoSuffixs = [
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".flv",
    ".wmv",
    ".ts",
    ".f4v",
    ".m4v",
    ".mpg",
    ".mpeg",
    ".vob",
    ".webm",
    ".m2ts",
    ".3gp",
]


Codec = {
    "av1": 1.0,
    "vp9": 0.85,
    "hevc": 0.8,
    "h265": 0.8,
    "hev1": 0.8,
    "h264": 0.65,
    "avc1": 0.65,
    "mpeg4": 0.5,
    "vc1": 0.5,
    "flv1": 0.4,
    "flv": 0.4,
    "mpeg2video": 0.35,
    "mpeg2": 0.35,
    "wmv3": 0.35,
    "prores": 0.3,
    "wmv1": 0.15,
    "mpeg1video": 0.15,
    "mp4v": 0.15,
}

CODEC_ID = {k: i for i, k in enumerate(Codec)}

Language = Literal[
    "en",
    "ja",
    "zh",
    "zh-CN",
    "zh-TW",
    "ko",
    "fr",
    "de",
    "es",
    "it",
    "ru",
    "pt",
    "ar",
    "th",
    "vi",
]

DATA_PATH = Path(__file__).parent.parent / "data"
