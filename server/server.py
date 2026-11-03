"""
UnimaxDL — FastAPI REST API Server
===================================
Provides the HTTP interface consumed by the web, desktop, and Android
front-ends.  Designed to run on the user's own PC (``localhost:8000``)
and be reachable over LAN for mobile devices.
"""

from __future__ import annotations

import logging
import mimetypes
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, HttpUrl, field_validator

from downloader import (
    DOWNLOADS_DIR,
    create_download_task,
    extract_info,
    format_bytes,
    get_all_tasks,
    get_task,
)

logger = logging.getLogger("unimaxdl.server")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="UnimaxDL Server",
    description="Universal Media Downloader — local API server",
    version="1.0.0",
)

# CORS — wide open so any device on the LAN can talk to us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Static / media mounts
# ---------------------------------------------------------------------------

STATIC_DIR = Path(__file__).resolve().parent / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

# Serve downloaded files at /media/<filename>
app.mount("/media", StaticFiles(directory=str(DOWNLOADS_DIR)), name="media")

# Serve front-end assets at /static/
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def url_must_be_non_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("URL must not be empty")
        return v


class DownloadRequest(BaseModel):
    url: str
    type: str = "video"  # "video" | "audio"
    quality: str = "1080"
    title: str = ""
    thumbnail: str = ""

    @field_validator("url")
    @classmethod
    def url_must_be_non_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("URL must not be empty")
        return v

    @field_validator("type")
    @classmethod
    def type_must_be_valid(cls, v: str) -> str:
        if v not in ("video", "audio"):
            raise ValueError("type must be 'video' or 'audio'")
        return v


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
async def root(request: Request) -> Any:
    """Serve ``static/index.html`` if present, otherwise return API status."""
    index = STATIC_DIR / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return {
        "name": "UnimaxDL Server",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/ping")
async def ping() -> Dict[str, str]:
    """Health-check endpoint."""
    return {"status": "ok", "name": "UnimaxDL Server", "version": "1.0.0"}


@app.post("/api/analyze")
async def analyze(body: AnalyzeRequest) -> Dict[str, Any]:
    """Extract metadata and available formats from a URL."""
    try:
        info = extract_info(body.url)
        return {"status": "ok", "data": info}
    except Exception as exc:
        logger.exception("analyze failed for %s", body.url)
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/download")
async def download(body: DownloadRequest) -> Dict[str, Any]:
    """Start a new download task and return its ID immediately."""
    try:
        task_id = create_download_task(
            url=body.url,
            download_type=body.type,
            quality=body.quality,
            title=body.title,
            thumbnail=body.thumbnail,
        )
        return {"status": "ok", "task_id": task_id}
    except Exception as exc:
        logger.exception("download creation failed for %s", body.url)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/tasks")
async def list_tasks() -> Dict[str, Any]:
    """Return all tasks sorted by creation time (newest first)."""
    return {"status": "ok", "tasks": get_all_tasks()}


@app.get("/api/tasks/{task_id}")
async def task_status(task_id: str) -> Dict[str, Any]:
    """Return the status of a single task."""
    task = get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "ok", "task": task}


@app.get("/api/library")
async def library() -> Dict[str, Any]:
    """Scan the downloads directory and return file metadata."""
    files: List[Dict[str, Any]] = []
    try:
        for entry in sorted(DOWNLOADS_DIR.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
            if entry.name.startswith("."):
                continue
            if not entry.is_file():
                continue

            stat = entry.stat()
            mime, _ = mimetypes.guess_type(entry.name)
            media_type = "video" if (mime and mime.startswith("video")) else (
                "audio" if (mime and mime.startswith("audio")) else "other"
            )

            files.append(
                {
                    "name": entry.name,
                    "size": stat.st_size,
                    "size_label": format_bytes(stat.st_size),
                    "type": media_type,
                    "mime": mime,
                    "modified": datetime.fromtimestamp(
                        stat.st_mtime, tz=timezone.utc
                    ).isoformat(),
                    "media_url": f"/media/{entry.name}",
                }
            )
    except Exception as exc:
        logger.exception("Failed to scan library")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"status": "ok", "files": files, "count": len(files)}


@app.delete("/api/library/{filename}")
async def delete_file(filename: str) -> Dict[str, str]:
    """Delete a single file from the downloads directory.

    Includes path-traversal protection: the resolved path **must** remain
    inside ``DOWNLOADS_DIR``.
    """
    # Reject obviously suspicious names first
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    target = (DOWNLOADS_DIR / filename).resolve()

    # Path-traversal guard
    if not str(target).startswith(str(DOWNLOADS_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")

    if not target.exists():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        target.unlink()
        logger.info("Deleted file: %s", filename)
        return {"status": "ok", "message": f"Deleted {filename}"}
    except Exception as exc:
        logger.exception("Failed to delete %s", filename)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
