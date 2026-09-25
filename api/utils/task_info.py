import asyncio
import shlex
import json
from pathlib import Path
from pydantic import BaseModel

from models import *
from utils.logger import LoggerBase as lg


class VideoTaskSpwanResponse(BaseModel):
    info: VideoInfo
    args: VideoTranscodeArgs


PIX_FMT_MAP = {
    420: {
        8: "yuv420p",
        10: "yuv420p10le",
        12: "yuv420p12le",
        14: "yuv420p14le",
        16: "yuv420p16le",
    },
    422: {
        8: "yuv422p",
        10: "yuv422p10le",
        12: "yuv422p12le",
        14: "yuv422p14le",
        16: "yuv422p16le",
    },
    444: {
        8: "yuv444p",
        10: "yuv444p10le",
        12: "yuv444p12le",
        14: "yuv444p14le",
        16: "yuv444p16le",
    },
}


class TaskInfo:
    def __init__(self, path: Path):
        if not path.is_file():
            raise FileNotFoundError(f"Input file {path} is missing.")

        self.type: Literal["image", "video"]
        if path.suffix.lower() in ImageSuffixs:
            self.type = "image"
        elif path.suffix.lower() in VideoSuffixs:
            self.type = "video"
        else:
            raise ValueError(f"Unsupported file type: {path.suffix}")

        self.path = path
        self.info: VideoInfo | ImageInfo
        self.args: VideoTranscodeArgs

    @classmethod
    async def run(cls, path: Path):
        self = cls(path)
        await self._fetch_file_info()
        lg.debug(f"Fetch {self.type} {self.path} info: {self.info}")
        self._fetch_transcode_args()

        return self

    def response(self) -> VideoTaskSpwanResponse | ImageInfo:
        if isinstance(self.info, VideoInfo):
            return VideoTaskSpwanResponse(info=self.info, args=self.args)
        else:
            return self.info

    async def _fetch_file_info(self):
        # run command
        self.proc = await asyncio.create_subprocess_exec(
            *self._command(),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        # fetch data
        stdout, stderr = await self.proc.communicate()
        if self.proc.returncode != 0:
            raise RuntimeError(f"ffprobe failed: {stderr.decode()}")
        data = json.loads(stdout)["streams"]
        video = next((s for s in data if s.get("codec_type") == "video"), {})
        audio = next((s for s in data if s.get("codec_type") == "audio"), {})

        # Extract and validate information based on type
        if self.type == "video":
            if (
                not video.get("codec_name")
                or not video.get("avg_frame_rate")
                or not video.get("duration")
            ):
                raise ValueError("Missing required video information.")
            if Codec.get(video["codec_name"]) is None:
                raise ValueError(f"Unsupported codec: {video['codec_name']}")

            if not audio:
                audio["bit_rate"] = 0
            elif audio.get("bit_rate") is None or not audio["bit_rate"].isdigit():
                audio["bit_rate"] = 128000  # Default to 128 kbps

            self.info = VideoInfo(
                path=self.path,
                size=self.path.stat().st_size,
                codec=video["codec_name"],
                width=int(video.get("width", 0)),
                height=int(video.get("height", 0)),
                sar=video.get("sample_aspect_ratio", "N/A"),
                pix_fmt=video.get("pix_fmt", "yuv420p").lower(),
                color_space=video.get("color_space", "").lower(),
                color_transfer=video.get("color_transfer", "").lower(),
                color_primaries=video.get("color_primaries", "").lower(),
                frame_rate=(
                    lambda x: (
                        round(float(x[0]) / float(x[1]), 1) if float(x[1]) != 0 else 0.0
                    )
                )(video["avg_frame_rate"].split("/")),
                bit_rate=(
                    int(video["bit_rate"])
                    if video.get("bit_rate") and video["bit_rate"].isdigit()
                    else 0
                ),
                duration=float(video["duration"]),
                audio_bit_rate=(int(audio["bit_rate"])),
            )

        else:
            if not video.get("width") or not video.get("height"):
                raise ValueError("Missing required image information.")

            sar = video.get("sample_aspect_ratio", "N/A")
            cs = video.get("color_space", "").lower()
            ct = video.get("color_transfer", "").lower()
            cp = video.get("color_primaries", "").lower()

            self.info = ImageInfo(
                path=self.path,
                output_name=self.path.stem,
                size=self.path.stat().st_size,
                width=int(video["width"]),
                height=int(video["height"]),
                sar=sar,
                pix_fmt=video.get("pix_fmt", "yuv420p").lower(),
                color_space=cs,
                color_transfer=ct,
                color_primaries=cp,
                zscale=self._check_zscale(cs, ct, cp, "image"),
                sar_fix=self._check_sar(sar),
            )

    def _fetch_transcode_args(self):
        if isinstance(self.info, VideoInfo):
            avg_br = round(
                self.info.size * 8 / self.info.duration - self.info.audio_bit_rate
            )
            v_br = (
                self.info.bit_rate
                if abs(self.info.bit_rate - avg_br) / avg_br <= 0.13
                else avg_br
            )

            self.args = VideoTranscodeArgs(
                zscale=self._check_zscale(
                    self.info.color_space,
                    self.info.color_transfer,
                    self.info.color_primaries,
                    "video",
                ),
                pix_fmt=PIX_FMT_MAP[self._check_fmt_chroma(self.info.pix_fmt)][
                    self._check_fmt_bit(self.info.pix_fmt)
                ],
                sar_fix=self._check_sar(self.info.sar),
                video_br=round(v_br * Codec[self.info.codec]),
                audio_br=self.info.audio_bit_rate,
            )

            lg.debug(f"Fetch Video {self.path} args: {self.args}")

    @classmethod
    def fetch_multivideo_args(cls, infos: list[VideoInfo]) -> VideoTranscodeArgs:
        c_s = {f.color_space for f in infos if f.color_space is not None}
        c_t = {f.color_transfer for f in infos if f.color_transfer is not None}
        c_p = {f.color_primaries for f in infos if f.color_primaries is not None}

        if len(c_s) > 1 or len(c_t) > 1 or len(c_p) > 1:
            raise ValueError(
                "Input files must have the same color space, transfer and primaries."
            )

        for key in ["width", "height", "frame_rate", "sar", "codec", "pix_fmt"]:
            if not all(getattr(f, key) == getattr(infos[0], key) for f in infos):
                raise Exception(f"Input files must have the same {key}.")

        avg_br = round(
            sum((f.size * 8 / f.duration - f.audio_bit_rate) for f in infos)
            / len(infos)
        )
        max_br = max(f.bit_rate for f in infos)
        v_br = max_br if abs(max_br - avg_br) / avg_br <= 0.15 else avg_br

        args = VideoTranscodeArgs(
            zscale=cls._check_zscale(
                c_s.pop() if c_s else "",
                c_t.pop() if c_t else "",
                c_p.pop() if c_p else "",
                "video",
            ),
            pix_fmt=PIX_FMT_MAP[cls._check_fmt_chroma(infos[0].pix_fmt)][
                cls._check_fmt_bit(infos[0].pix_fmt)
            ],
            video_br=round(v_br * Codec[infos[0].codec]),
            audio_br=max(f.audio_bit_rate for f in infos),
            sar_fix=cls._check_sar(infos[0].sar),
        )
        lg.debug(f"Fetch multivideo args: {args}")
        return args

    def _command(self):
        if self.type == "video":
            cmd = [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "stream="
                "codec_type,codec_name,width,height,"
                "avg_frame_rate,sample_aspect_ratio,bit_rate,duration,"
                "pix_fmt,color_space,color_transfer,color_primaries,"
                "sample_rate,channels,channel_layout",
                "-of",
                "json",
                str(self.path.resolve()),
            ]
        else:
            cmd = [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "stream="
                "codec_type,width,height,avg_frame_rate,sample_aspect_ratio,"
                "pix_fmt,color_space,color_transfer,color_primaries",
                "-of",
                "json",
                str(self.path.resolve()),
            ]
        lg.debug(
            f"Fetch file info with command: {' '.join(shlex.quote(arg) for arg in cmd)}"
        )
        return cmd

    @staticmethod
    def _check_sar(sar: str) -> str:
        if not sar in ["N/A", "1:1"]:
            sar_w, sar_h = map(float, sar.split(":"))
            return f"scale=trunc(iw*{sar_w/sar_h}/2)*2:trunc(ih/2)*2"
        return ""

    @staticmethod
    def _check_hdr(ct: str) -> bool:
        ct = ct.lower()

        hdr_transfer = {
            "smpte2084",  # PQ (HDR10 / HDR10+)
            "arib-std-b67",  # HLG
            "smpte428",  # Cineon (罕见 HDR/DI)
        }
        if ct in hdr_transfer:
            return True

        # Check for HDR in color primaries (PQ/HLG)
        if "pq" in ct or "hlg" in ct:
            return True

        return False

    @classmethod
    def _check_zscale(
        cls,
        cs: str,
        ct: str,
        cp: str,
        type: Literal["video", "image"],
    ) -> str:
        cmd = "zscale="
        hdr = cls._check_hdr(ct)

        # Check input color space, transfer, and primaries
        if cs == "":
            cmd += f"matrixin={'bt2020nc' if hdr else 'bt709'}:"
        else:
            cmd += f"matrixin={cs}:"

        if ct == "":
            cmd += f"transferin={'smpte2084' if hdr else ('bt709' if type == "video" else 'iec61966-2-1')}:"
        else:
            cmd += f"transferin={ct}:"

        if cp == "":
            cmd += f"primariesin={'bt2020' if hdr else 'bt709'}:"
        else:
            cmd += f"primariesin={cp}:"

        # Set output color space, transfer, and primaries based on HDR or SDR
        if type == "video":
            cmd += "range=tv:"
        else:
            cmd += "range=pc:"

        if hdr:
            cmd += f"matrix=bt2020nc:transfer=smpte2084:primaries=bt2020:npl=1000"
        elif type == "video":
            cmd += "matrix=bt709:transfer=bt709:primaries=bt709"
        else:
            cmd += "matrix=bt709:transfer=iec61966-2-1:primaries=bt709"

        return cmd

    @staticmethod
    def _check_fmt_chroma(fmt: str) -> Literal[420, 422, 444]:
        fmt = fmt.lower()

        # Direct explicit match (fast path)
        if "420" in fmt:
            return 420
        if "422" in fmt:
            return 422
        if "444" in fmt:
            return 444

        # Common explicit patterns
        if fmt in ["nv12", "nv21", "p010le", "p016le", "p012le"]:
            return 420
        if fmt in ["p210le", "p216le"]:
            return 422
        if any(x in fmt for x in ["gbr", "rgb", "bgr"]):
            return 444

        return 420

    @staticmethod
    def _check_fmt_bit(fmt: str) -> Literal[8, 10, 12, 14, 16]:
        fmt = fmt.lower()

        # Direct explicit match (fast path)
        if "16le" in fmt or "16be" in fmt:
            return 16
        if "12le" in fmt or "12be" in fmt:
            return 12
        if "10le" in fmt or "10be" in fmt:
            return 10

        # Common explicit patterns
        if "p16" in fmt:
            return 16
        if "p12" in fmt:
            return 12
        if "p10" in fmt:
            return 10
        if "p8" in fmt:
            return 8

        # Packed hardware formats
        hw_map = {
            "nv12": 8,
            "yuyv422": 8,
            "uyvy422": 8,
            "yuvj420p": 8,
            "yuvj422p": 8,
            "yuvj444p": 8,
            "bgr0": 8,
            "rgb0": 8,
            "p010le": 10,
            "p016le": 16,
            "p012le": 12,
            "p210le": 10,
            "p216le": 16,
        }
        if fmt in hw_map:
            return hw_map[fmt]  # type: ignore

        # Common suffix patterns
        if any(x in fmt for x in ["yuv", "rgb", "bgr", "pal"]):
            return 8

        return 8
