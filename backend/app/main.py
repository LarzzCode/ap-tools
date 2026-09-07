from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.media import router as media_router


app = FastAPI(
    title="Ditya Tools Local Service",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        # Production
        "https://ditya-tools.vercel.app",
    ],
    allow_origin_regex=(
        r"https://.*\.vercel\.app"
    ),
    allow_credentials=False,
    allow_methods=[
        "GET",
        "POST",
        "OPTIONS",
    ],
    allow_headers=["*"],
)


app.include_router(media_router)


@app.get("/")
def root():
    return {
        "name": "Ditya Tools Local Service",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ap-tools-local-service",
        "version": "0.1.0",
    }