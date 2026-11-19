import asyncio
import shutil
import tempfile
from pathlib import Path

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    UploadFile,
)

from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.models.media import (
    MediaAnalysis,
    MediaAnalyzeRequest,
    MediaDownloadPrepared,
    MediaDownloadRequest,
)

from app.services.converter import convert_local_media
from app.services.media import (
    MediaAnalysisError,
    MediaDownloadError,
    UnsupportedMediaUrlError,
    analyze_youtube,
    cleanup_directory,
    prepare_youtube_download,
    take_download,
)


router = APIRouter(
    prefix="/media",
    tags=["Media"],
)


@router.post(
    "/analyze",
    response_model=MediaAnalysis,
)
async def analyze_media(
    payload: MediaAnalyzeRequest,
):
    try:
        return await asyncio.to_thread(
            analyze_youtube,
            str(payload.url),
        )

    except UnsupportedMediaUrlError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except MediaAnalysisError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error


@router.post(
    "/download/prepare",
    response_model=MediaDownloadPrepared,
)
async def prepare_download(
    payload: MediaDownloadRequest,
):
    try:
        return await asyncio.to_thread(
            prepare_youtube_download,
            str(payload.url),
            payload.mode,
            payload.quality,
            payload.audio_format,
        )

    except UnsupportedMediaUrlError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except MediaDownloadError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error


@router.post(
    "/local/convert",
    response_model=MediaDownloadPrepared,
)
async def convert_media(
    file: UploadFile = File(...),
    output_format: str = Form("mp4"),
    preset: str = Form("balanced"),
    start_time: str | None = Form(None),
    end_time: str | None = Form(None),
):
    upload_dir = Path(
        tempfile.mkdtemp(prefix="ditya-tools-upload-")
    )
    suffix = Path(file.filename or "input.bin").suffix or ".bin"
    source_path = upload_dir / f"source{suffix}"

    try:
        with source_path.open("wb") as handle:
            shutil.copyfileobj(file.file, handle)

        return await asyncio.to_thread(
            convert_local_media,
            source_path,
            file.filename or "media",
            output_format,
            preset,
            start_time,
            end_time,
        )
    except MediaDownloadError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error
    finally:
        await file.close()
        cleanup_directory(upload_dir)


@router.get(
    "/download/{download_id}",
)
async def download_media(
    download_id: str,
):
    artifact = take_download(
        download_id,
    )

    if artifact is None:
        raise HTTPException(
            status_code=404,
            detail="Download not found or expired.",
        )

    return FileResponse(
        path=artifact.path,
        filename=artifact.filename,
        media_type=artifact.media_type,
        background=BackgroundTask(
            cleanup_directory,
            artifact.directory,
        ),
    )