import logging
import re
import shutil
import tempfile
import threading
import time
import uuid

from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

import yt_dlp
from yt_dlp.utils import DownloadError

logger = logging.getLogger(__name__)


ALLOWED_YOUTUBE_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
}


class UnsupportedMediaUrlError(Exception):
    pass


class MediaAnalysisError(Exception):
    pass

class MediaDownloadError(Exception):
    pass


@dataclass
class DownloadArtifact:
    path: Path
    directory: Path
    filename: str
    media_type: str
    created_at: float


_downloads: dict[str, DownloadArtifact] = {}
_downloads_lock = threading.Lock()

DOWNLOAD_TTL_SECONDS = 30 * 60

def validate_youtube_url(url: str) -> None:
    parsed = urlparse(url)

    if parsed.scheme not in {"http", "https"}:
        raise UnsupportedMediaUrlError(
            "Only HTTP and HTTPS URLs are supported."
        )

    hostname = (parsed.hostname or "").lower()

    if hostname not in ALLOWED_YOUTUBE_HOSTS:
        raise UnsupportedMediaUrlError(
            "Please enter a valid YouTube URL."
        )


def get_js_runtimes() -> dict:
    node_path = shutil.which("node")

    if not node_path:
        return {}

    return {
        "node": {
            "path": node_path,
        }
    }


def get_format_kind(
    video_codec: str | None,
    audio_codec: str | None,
) -> str:
    has_video = (
        video_codec is not None
        and video_codec != "none"
    )

    has_audio = (
        audio_codec is not None
        and audio_codec != "none"
    )

    if has_video and has_audio:
        return "combined"

    if has_video:
        return "video"

    if has_audio:
        return "audio"

    return "unknown"


def analyze_youtube(url: str) -> dict:
    validate_youtube_url(url)

    options = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "socket_timeout": 15,
    }

    try:
        with yt_dlp.YoutubeDL(
            options
        ) as ydl:
            info = ydl.extract_info(
                url,
                download=False,
            )

    except DownloadError as error:
        error_message = str(error)

        logger.exception(
            "yt-dlp failed to analyze media"
        )

        if "This video is unavailable" in error_message:
            raise MediaAnalysisError(
                "This YouTube video is unavailable."
            ) from error

        if "Private video" in error_message:
            raise MediaAnalysisError(
                "This YouTube video is private."
            ) from error

        if "Video unavailable" in error_message:
            raise MediaAnalysisError(
                "This YouTube video is unavailable."
            ) from error

        raise MediaAnalysisError(
            "We could not analyze this YouTube video."
        ) from error

    if not isinstance(info, dict):
        raise MediaAnalysisError(
            "YouTube returned an unexpected response."
        )

    if info.get("_type") in {
        "playlist",
        "multi_video",
    }:
        raise UnsupportedMediaUrlError(
            "Please enter a single YouTube video URL."
        )

    normalized_formats = []

    for media_format in info.get(
        "formats",
        [],
    ):
        format_id = media_format.get(
            "format_id"
        )

        if not format_id:
            continue

        video_codec = media_format.get(
            "vcodec"
        )

        audio_codec = media_format.get(
            "acodec"
        )

        kind = get_format_kind(
            video_codec,
            audio_codec,
        )

        if kind == "unknown":
            continue

        filesize = (
            media_format.get("filesize")
            or media_format.get(
                "filesize_approx"
            )
        )

        normalized_formats.append(
            {
                "format_id":
                    str(format_id),

                "kind":
                    kind,

                "ext":
                    media_format.get(
                        "ext"
                    ),

                "width":
                    media_format.get(
                        "width"
                    ),

                "height":
                    media_format.get(
                        "height"
                    ),

                "fps":
                    media_format.get(
                        "fps"
                    ),

                "filesize":
                    filesize,

                "video_codec":
                    video_codec,

                "audio_codec":
                    audio_codec,

                "audio_bitrate":
                    media_format.get(
                        "abr"
                    ),

                "total_bitrate":
                    media_format.get(
                        "tbr"
                    ),
            }
        )

    return {
        "id":
            str(info.get("id", "")),

        "title":
            info.get("title")
            or "Untitled video",

        "webpage_url":
            info.get("webpage_url"),

        "thumbnail":
            info.get("thumbnail"),

        "channel":
            info.get("channel")
            or info.get("uploader"),

        "channel_url":
            info.get("channel_url")
            or info.get(
                "uploader_url"
            ),

        "duration":
            info.get("duration"),

        "formats":
            normalized_formats,
    }

def cleanup_directory(
    directory: Path,
) -> None:
    import shutil

    shutil.rmtree(
        directory,
        ignore_errors=True,
    )


def cleanup_expired_downloads() -> None:
    now = time.time()

    expired_ids = []

    with _downloads_lock:
        for download_id, artifact in _downloads.items():
            if (
                now - artifact.created_at
                > DOWNLOAD_TTL_SECONDS
            ):
                expired_ids.append(download_id)

        expired_artifacts = [
            _downloads.pop(download_id)
            for download_id in expired_ids
        ]

    for artifact in expired_artifacts:
        cleanup_directory(
            artifact.directory,
        )

def cleanup_directory(
    directory: Path,
) -> None:
    import shutil

    shutil.rmtree(
        directory,
        ignore_errors=True,
    )


def cleanup_expired_downloads() -> None:
    now = time.time()

    expired_ids = []

    with _downloads_lock:
        for download_id, artifact in _downloads.items():
            if (
                now - artifact.created_at
                > DOWNLOAD_TTL_SECONDS
            ):
                expired_ids.append(download_id)

        expired_artifacts = [
            _downloads.pop(download_id)
            for download_id in expired_ids
        ]

    for artifact in expired_artifacts:
        cleanup_directory(
            artifact.directory,
        )

def find_downloaded_file(
    directory: Path,
) -> Path:
    ignored_suffixes = {
        ".part",
        ".ytdl",
        ".temp",
    }

    candidates = [
        path
        for path in directory.iterdir()
        if (
            path.is_file()
            and path.suffix.lower()
            not in ignored_suffixes
        )
    ]

    if not candidates:
        raise MediaDownloadError(
            "The media file was not created."
        )

    return max(
        candidates,
        key=lambda path: path.stat().st_mtime,
    )

def safe_filename(value: str) -> str:
    cleaned = re.sub(
        r'[<>:"/\\|?*\x00-\x1f]',
        "",
        value,
    )

    cleaned = cleaned.strip().rstrip(".")

    if not cleaned:
        return "ap-tools-media"

    return cleaned[:120]

def prepare_youtube_download(
    url: str,
    mode: str,
    quality: int | None,
    audio_format: str,
) -> dict:
    validate_youtube_url(url)
    cleanup_expired_downloads()

    ffmpeg_path = shutil.which("ffmpeg")

    if not ffmpeg_path:
        raise MediaDownloadError(
            "FFmpeg was not found on this computer."
        )

    if mode == "video":
        if quality is None:
            raise MediaDownloadError(
                "Choose a video quality first."
            )

        if quality not in {
            144,
            240,
            360,
            480,
            720,
            1080,
            1440,
            2160,
        }:
            raise MediaDownloadError(
                "Unsupported video quality."
            )

    if (
        mode == "audio"
        and audio_format not in {"mp3", "m4a"}
    ):
        raise MediaDownloadError(
            "Unsupported audio format."
        )

    temp_directory = Path(
        tempfile.mkdtemp(
            prefix="ap-tools-media-",
        )
    )

    output_template = str(
        temp_directory
        / "%(id)s.%(ext)s"
    )

    options = {
        "quiet": False,
        "no_warnings": False,
        "verbose": True,
        "noplaylist": True,
        "socket_timeout": 30,
        "outtmpl": output_template,
    }

    if mode == "video":
        options["format"] = (
            f"bv*[height<={quality}]"
            "[ext=mp4]"
            "+ba[ext=m4a]"
            f"/b[height<={quality}]"
            "[ext=mp4]"
        )

        options["merge_output_format"] = "mp4"

    else:
        options["format"] = "bestaudio/best"

        options["postprocessors"] = [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": audio_format,
            }
        ]

    try:
        with yt_dlp.YoutubeDL(
            options
        ) as ydl:
            info = ydl.extract_info(
                url,
                download=True,
            )

    except DownloadError as error:
        cleanup_directory(
            temp_directory,
        )

        logger.exception(
            "yt-dlp download failed"
        )

        raise MediaDownloadError(
            "We could not prepare this media file."
        ) from error

    except Exception as error:
        cleanup_directory(
            temp_directory,
        )

        logger.exception(
            "Media preparation failed"
        )

        raise MediaDownloadError(
            "Media preparation failed."
        ) from error

    try:
        final_file = find_downloaded_file(
            temp_directory,
        )
    except Exception:
        cleanup_directory(
            temp_directory,
        )
        raise

    title = (
        info.get("title")
        if isinstance(info, dict)
        else None
    )

    title = safe_filename(
        title or "ap-tools-media"
    )

    extension = (
        final_file.suffix
        .lower()
        .lstrip(".")
    )

    filename = f"{title}.{extension}"

    if extension == "mp3":
        media_type = "audio/mpeg"

    elif extension == "m4a":
        media_type = "audio/mp4"

    elif extension == "mp4":
        media_type = "video/mp4"

    else:
        media_type = (
            "application/octet-stream"
        )

    download_id = uuid.uuid4().hex

    artifact = DownloadArtifact(
        path=final_file,
        directory=temp_directory,
        filename=filename,
        media_type=media_type,
        created_at=time.time(),
    )

    with _downloads_lock:
        _downloads[
            download_id
        ] = artifact

    return {
        "download_id":
            download_id,

        "filename":
            filename,

        "download_url":
            f"/media/download/{download_id}",
    }

def take_download(
    download_id: str,
) -> DownloadArtifact | None:
    cleanup_expired_downloads()

    with _downloads_lock:
        return _downloads.pop(
            download_id,
            None,
        )

def take_download(
    download_id: str,
) -> DownloadArtifact | None:
    cleanup_expired_downloads()

    with _downloads_lock:
        return _downloads.pop(
            download_id,
            None,
        )