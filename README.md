# Ditya Tools (`ap-tools`)

Simple, fast, privacy-focused everyday utilities — **No ads. No clutter. Just tools.**

## Architecture

- **Frontend (`src/`)**: React 19 + TypeScript + Vite + Tailwind CSS v4.
  - Most utilities run **100% locally in your browser** (`pdf-lib`, `qrcode`, `jsqr`, Canvas API, `@huggingface/transformers`).
- **Local Service (`backend/`)**: FastAPI server running on `http://127.0.0.1:8787` for heavy media capabilities (`yt-dlp` and `ffmpeg`) without uploading your files to an external cloud server.

---

## Running Frontend

```bash
npm install
npm run dev
```

---

## Cara Menyalakan Local Service (`http://127.0.0.1:8787`)

Media tools (**YouTube Downloader** & **Media Clipper & Converter**) membutuhkan **Local Service** berjalan di komputer kamu.

### Prasyarat
1. **Python 3.10+**
2. **FFmpeg** terpasang dan ada di `PATH`:
   - **Windows**: `winget install Gyan.FFmpeg` (lalu restart terminal)
   - **macOS**: `brew install ffmpeg`
   - **Linux (Ubuntu/Debian)**: `sudo apt install ffmpeg`

### Setup Pertama Kali

**Windows (PowerShell):**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
```

**macOS / Linux:**
```bash
cd backend
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
```

### Menyalakan Local Service

**Windows:**
Dari root project:
```powershell
npm run backend
```
atau dari folder `backend`:
```powershell
.\.venv\Scripts\uvicorn app.main:app --reload --host 127.0.0.1 --port 8787
```

**macOS / Linux:**
Dari root project:
```bash
npm run backend:unix
```
atau dari folder `backend`:
```bash
./.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8787
```

Jika berhasil, buka `http://127.0.0.1:8787/health` atau klik **Check again** pada banner status di halaman tool media — status akan berubah menjadi **Local service connected**.
