from pydantic import BaseModel, HttpUrl
from typing import Literal


class MediaAnalyzeRequest(BaseModel):
    url: HttpUrl


class MediaFormat(BaseModel):
    format_id: str
    kind: str
    ext: str | None = None

    width: int | None = None
    height: int | None = None
    fps: float | None = None

    filesize: int | None = None

    video_codec: str | None = None
    audio_codec: str | None = None

    audio_bitrate: float | None = None
    total_bitrate: float | None = None


class MediaAnalysis(BaseModel):
    id: str
    title: str

    webpage_url: str | None = None
    thumbnail: str | None = None

    channel: str | None = None
    channel_url: str | None = None

    duration: float | None = None

    formats: list[MediaFormat]

class MediaDownloadRequest(BaseModel):
    url: HttpUrl

    mode: Literal[
        "video",
        "audio",
    ]

    quality: int | None = None

    audio_format: Literal[
        "mp3",
        "m4a",
    ] = "mp3"


class MediaDownloadPrepared(BaseModel):
    download_id: str
    filename: str
    download_url: str