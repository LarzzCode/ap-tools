import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from app.services.media import (
    MediaDownloadError,
    cleanup_directory,
    cleanup_expired_downloads,
    register_download,
    safe_filename,
)

ALLOWED_OUTPUT_FORMATS = {
    "mp4": "video/mp4",
    "webm": "video/webm",
    "mp3": "audio/mpeg",
    "m4a": "audio/mp4",
    "wav": "audio/wav",
    "gif": "image/gif",
}

ALLOWED_COMPRESSION_PRESETS = {
    "original": "20",
    "balanced": "26",
    "compact": "31",
}

TIME_PATTERN = re.compile(r"^\d{1,3}(:\d{1,2}){0,2}(\.\d{1,3})?$")


def validate_timestamp(value: str | None, label: str) -> str | None:
    if value is None:
        return None

    trimmed = value.strip()
    if not trimmed:
        return None

    if not TIME_PATTERN.match(trimmed):
        raise MediaDownloadError(
            f"Invalid {label} time format. Use seconds (e.g. 12) or MM:SS (e.g. 01:30)."
        )

    return trimmed


def convert_local_media(
    source_path: Path,
    original_filename: str,
    output_format: str,
    preset: str = "balanced",
    start_time: str | None = None,
    end_time: str | None = None,
) -> dict:
    cleanup_expired_downloads()

    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        raise MediaDownloadError(
            "FFmpeg was not found on this computer. Install FFmpeg first to convert or clip media."
        )

    fmt = output_format.lower().strip()
    if fmt not in ALLOWED_OUTPUT_FORMATS:
        raise MediaDownloadError(
            f"Unsupported output format: {output_format}."
        )

    crf = ALLOWED_COMPRESSION_PRESETS.get(preset, "26")
    clean_start = validate_timestamp(start_time, "start")
    clean_end = validate_timestamp(end_time, "end")

    temp_directory = Path(
        tempfile.mkdtemp(prefix="ditya-tools-convert-")
    )

    stem = safe_filename(Path(original_filename).stem)
    output_filename = f"{stem}-converted.{fmt}"
    output_path = temp_directory / output_filename

    command = [ffmpeg_path, "-y", "-hide_banner", "-loglevel", "error"]

    if clean_start:
        command.extend(["-ss", clean_start])

    command.extend(["-i", str(source_path)])

    if clean_end:
        command.extend(["-to", clean_end])

    if fmt in {"mp3", "m4a", "wav"}:
        command.append("-vn")
        if fmt == "mp3":
            command.extend(["-c:a", "libmp3lame", "-q:a", "2"])
        elif fmt == "m4a":
            command.extend(["-c:a", "aac", "-b:a", "192k"])
        else:
            command.extend(["-c:a", "pcm_s16le"])
    elif fmt == "gif":
        command.extend([
            "-vf",
            "fps=12,scale=640:-1:flags=lanczos",
            "-loop",
            "0",
        ])
    elif fmt == "webm":
        command.extend([
            "-c:v",
            "libvpx-vp9",
            "-crf",
            crf,
            "-b:v",
            "0",
            "-c:a",
            "libopus",
        ])
    else:
        command.extend([
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            crf,
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-movflags",
            "+faststart",
        ])

    command.append(str(output_path))

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=600,
        )

        if result.returncode != 0 or not output_path.exists():
            detail = (result.stderr or "").strip()
            raise MediaDownloadError(
                detail or "FFmpeg could not convert this media file."
            )

        return register_download(
            path=output_path,
            directory=temp_directory,
            filename=output_filename,
            media_type=ALLOWED_OUTPUT_FORMATS[fmt],
        )
    except subprocess.TimeoutExpired as error:
        cleanup_directory(temp_directory)
        raise MediaDownloadError(
            "Media conversion timed out."
        ) from error
    except Exception:
        cleanup_directory(temp_directory)
        raise
