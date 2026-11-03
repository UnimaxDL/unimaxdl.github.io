"""
UnimaxDL — Core Download Engine
================================
Thread-safe download manager built on top of **yt-dlp**.

Features
--------
* In-memory task store guarded by ``threading.Lock``
* Bounded concurrency via ``ThreadPoolExecutor(max_workers=3)``
* FFmpeg pre-flight check at import time
* Video format detection (144p → 8K), audio quality selection
* Real-time progress tracking: percent, speed, ETA, bytes
* Analytics event emission on successful downloads
"""

from __future__ import annotations

import logging
import os
import re
import shutil
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import yt_dlp

from analytics import report_download

logger = logging.getLogger("unimaxdl.downloader")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
DOWNLOADS_DIR = BASE_DIR / "downloads"
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

MAX_WORKERS = 3

# Ordered list of "standard" resolutions we expose to the UI.
STANDARD_HEIGHTS: List[int] = [
    144, 240, 360, 480, 720, 1080, 1440, 2160, 4320,
]
HEIGHT_LABELS: Dict[int, str] = {
    144: "144p",
    240: "240p",
    360: "360p",
    480: "480p",
    720: "720p HD",
    1080: "1080p Full HD",
    1440: "1440p 2K",
    2160: "2160p 4K",
    4320: "4320p 8K",
}

# ---------------------------------------------------------------------------
# FFmpeg pre-flight
# ---------------------------------------------------------------------------

FFMPEG_AVAILABLE: bool = shutil.which("ffmpeg") is not None

if not FFMPEG_AVAILABLE:
    logger.warning(
        "ffmpeg not found on PATH — merging video+audio and some "
        "conversions will fail.  Install ffmpeg for full functionality."
    )

# ---------------------------------------------------------------------------
# Thread-safe task store
# ---------------------------------------------------------------------------

_tasks: Dict[str, Dict[str, Any]] = {}
_tasks_lock = threading.Lock()
_pool = ThreadPoolExecutor(max_workers=MAX_WORKERS, thread_name_prefix="dl")


def _set_task(task_id: str, data: Dict[str, Any]) -> None:
    with _tasks_lock:
        _tasks[task_id] = data


def _update_task(task_id: str, **kwargs: Any) -> None:
    with _tasks_lock:
        if task_id in _tasks:
            _tasks[task_id].update(kwargs)


def get_task(task_id: str) -> Optional[Dict[str, Any]]:
    """Return a *snapshot* of a single task, or ``None``."""
    with _tasks_lock:
        t = _tasks.get(task_id)
        return dict(t) if t else None


def get_all_tasks() -> List[Dict[str, Any]]:
    """Return snapshots of every task, newest first."""
    with _tasks_lock:
        items = [dict(v) for v in _tasks.values()]
    items.sort(key=lambda t: t.get("created_at", ""), reverse=True)
    return items


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_UNSAFE_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def sanitize_filename(name: str, max_len: int = 200) -> str:
    """Remove filesystem-unsafe characters and clamp length."""
    name = _UNSAFE_CHARS.sub("_", name).strip().strip(".")
    if len(name) > max_len:
        name = name[:max_len]
    return name or "download"


def format_bytes(size: Optional[float]) -> str:
    """Human-readable byte string (e.g. ``12.5 MB``)."""
    if size is None or size < 0:
        return "Unknown"
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if abs(size) < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} PB"


def format_duration(seconds: Optional[float]) -> str:
    """``seconds`` → ``HH:MM:SS`` or ``MM:SS``."""
    if seconds is None or seconds < 0:
        return "Unknown"
    s = int(seconds)
    h, remainder = divmod(s, 3600)
    m, sec = divmod(remainder, 60)
    if h > 0:
        return f"{h}:{m:02d}:{sec:02d}"
    return f"{m}:{sec:02d}"


def _domain(url: str) -> str:
    """Extract bare domain from a URL."""
    try:
        return urlparse(url).netloc.removeprefix("www.")
    except Exception:
        return "unknown"


# ---------------------------------------------------------------------------
# Metadata extraction
# ---------------------------------------------------------------------------

def get_cookie_file() -> Optional[str]:
    """Return path to cookie file if present, or write from YOUTUBE_COOKIES env var."""
    cookie_file = BASE_DIR / "cookies.txt"
    if not cookie_file.exists():
        content = os.environ.get("YOUTUBE_COOKIES", "").strip()
        if content:
            try:
                cookie_file.write_text(content, encoding="utf-8")
            except Exception:
                pass
    return str(cookie_file) if cookie_file.exists() else None


def cleanup_old_downloads(max_age_seconds: int = 1800) -> None:
    """Purge files older than 30 minutes to protect container disk space."""
    import time
    now = time.time()
    try:
        for p in DOWNLOADS_DIR.iterdir():
            if p.is_file() and not p.name.startswith("."):
                if now - p.stat().st_mtime > max_age_seconds:
                    try:
                        p.unlink()
                    except Exception:
                        pass
    except Exception:
        pass


def extract_info(url: str) -> Dict[str, Any]:
    """Extract metadata and available formats from *url*.

    Returns a dict ready for JSON serialisation that contains:
    ``title``, ``thumbnail``, ``duration``, ``formats`` (video list),
    ``audio_formats``, ``source``, ``original_url``.
    """
    ydl_opts: Dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "skip_download": True,
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "ios", "web"]
            }
        },
    }

    cookies = get_cookie_file()
    if cookies:
        ydl_opts["cookiefile"] = cookies

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info: Dict[str, Any] = ydl.extract_info(url, download=False)  # type: ignore[arg-type]

    title: str = info.get("title", "Unknown Title")
    thumbnail: str = info.get("thumbnail", "")
    duration: Optional[float] = info.get("duration")
    source: str = info.get("extractor", _domain(url))

    # ----- video formats -----
    seen_heights: set[int] = set()
    video_formats: List[Dict[str, Any]] = []

    for fmt in info.get("formats") or []:
        height = fmt.get("height")
        if not height or height < 100:
            continue
        if height in seen_heights:
            continue
        seen_heights.add(height)

        vcodec = fmt.get("vcodec", "none")
        if vcodec == "none":
            continue

        label = HEIGHT_LABELS.get(height, f"{height}p")
        filesize = fmt.get("filesize") or fmt.get("filesize_approx")
        video_formats.append(
            {
                "format_id": fmt.get("format_id", ""),
                "quality": label,
                "height": height,
                "ext": fmt.get("ext", "mp4"),
                "filesize": filesize,
                "filesize_label": format_bytes(filesize) if filesize else None,
                "fps": fmt.get("fps"),
                "vcodec": vcodec,
            }
        )

    # Sort descending by height so the UI shows best quality first.
    video_formats.sort(key=lambda f: f["height"], reverse=True)

    # ----- audio formats -----
    audio_formats: List[Dict[str, Any]] = [
        {"quality": "320", "label": "MP3 320 kbps (Best)", "format": "mp3"},
        {"quality": "192", "label": "MP3 192 kbps", "format": "mp3"},
        {"quality": "128", "label": "MP3 128 kbps", "format": "mp3"},
        {"quality": "original", "label": "M4A Original", "format": "m4a"},
    ]

    return {
        "title": title,
        "thumbnail": thumbnail,
        "duration": duration,
        "duration_label": format_duration(duration),
        "formats": video_formats,
        "audio_formats": audio_formats,
        "source": source,
        "original_url": url,
    }


# ---------------------------------------------------------------------------
# Download execution
# ---------------------------------------------------------------------------

def create_download_task(
    url: str,
    download_type: str,
    quality: str,
    title: str = "",
    thumbnail: str = "",
) -> str:
    """Create a task record and submit it to the thread pool.

    Returns the ``task_id``.
    """
    cleanup_old_downloads()
    task_id = uuid.uuid4().hex[:12]

    task: Dict[str, Any] = {
        "id": task_id,
        "url": url,
        "title": title or "Downloading…",
        "thumbnail": thumbnail,
        "type": download_type,
        "quality": quality,
        "status": "queued",
        "progress": 0,
        "speed": "",
        "eta": "",
        "downloaded": "",
        "total": "",
        "filename": None,
        "error": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
    }

    _set_task(task_id, task)

    _pool.submit(start_download_thread, task_id, url, download_type, quality)
    logger.info("Task %s queued: %s [%s %s]", task_id, url, download_type, quality)
    return task_id


def start_download_thread(
    task_id: str,
    url: str,
    download_type: str,
    quality_or_format: str,
) -> None:
    """Execute the download inside a worker thread.

    Updates the task dict in-place via ``_update_task`` so the REST API
    can stream progress to clients.
    """

    def _progress_hook(d: Dict[str, Any]) -> None:
        status = d.get("status", "")
        if status == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate")
            downloaded = d.get("downloaded_bytes", 0)
            speed = d.get("speed")
            eta = d.get("eta")

            pct = 0.0
            if total and total > 0:
                pct = round((downloaded / total) * 100, 1)

            _update_task(
                task_id,
                status="downloading",
                progress=pct,
                speed=format_bytes(speed) + "/s" if speed else "",
                eta=format_duration(eta) if eta else "",
                downloaded=format_bytes(downloaded),
                total=format_bytes(total),
            )
        elif status == "finished":
            _update_task(task_id, status="processing", progress=99)

    # Build yt-dlp options ------------------------------------------------
    safe_title = sanitize_filename(
        get_task(task_id).get("title", "download") if get_task(task_id) else "download"
    )
    output_template = str(DOWNLOADS_DIR / f"{safe_title}.%(ext)s")

    ydl_opts: Dict[str, Any] = {
        "outtmpl": output_template,
        "progress_hooks": [_progress_hook],
        "quiet": True,
        "no_warnings": True,
        "overwrites": True,
        "noprogress": True,
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "ios", "web"]
            }
        },
    }

    cookies = get_cookie_file()
    if cookies:
        ydl_opts["cookiefile"] = cookies

    if FFMPEG_AVAILABLE:
        ydl_opts["ffmpeg_location"] = shutil.which("ffmpeg")

    if download_type == "audio":
        if quality_or_format == "original":
            ydl_opts["format"] = "bestaudio[ext=m4a]/bestaudio/best"
            ydl_opts["postprocessors"] = []
        else:
            bitrate = quality_or_format if quality_or_format.isdigit() else "192"
            ydl_opts["format"] = "bestaudio/best"
            ydl_opts["postprocessors"] = [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": bitrate,
                }
            ]
    else:
        # Video
        height = "1080"
        m = re.search(r"(\d+)", quality_or_format)
        if m:
            height = m.group(1)

        ydl_opts["format"] = (
            f"bestvideo[height<={height}]+bestaudio/best[height<={height}]/best"
        )
        ydl_opts["merge_output_format"] = "mp4"

    # Run -----------------------------------------------------------------
    _update_task(task_id, status="downloading", progress=0)
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)

        # Determine final filename
        filename: Optional[str] = None
        if info:
            filename = ydl.prepare_filename(info)
            # After post-processing the extension may have changed
            for ext in ("mp3", "m4a", "mp4", "webm", "mkv", "opus"):
                candidate = Path(filename).with_suffix(f".{ext}")
                if candidate.exists():
                    filename = str(candidate)
                    break

        final_path = Path(filename) if filename else None
        file_size: Optional[float] = None
        if final_path and final_path.exists():
            file_size = final_path.stat().st_size
            display_name = final_path.name
        else:
            display_name = None

        _update_task(
            task_id,
            status="completed",
            progress=100,
            filename=display_name,
            completed_at=datetime.now(timezone.utc).isoformat(),
        )
        logger.info("Task %s completed: %s", task_id, display_name)

        # Analytics (fire-and-forget) ------------------------------------
        try:
            source_site = _domain(url)
            report_download(
                source_site=source_site,
                media_type=download_type,
                quality=quality_or_format,
                title=safe_title,
                url=url,
                file_size_mb=round(file_size / (1024 * 1024), 2) if file_size else 0,
                duration_sec=info.get("duration") if info else None,
            )
        except Exception:
            pass  # analytics must never crash the pipeline

    except Exception as exc:
        error_msg = str(exc)
        # Provide friendlier messages for common failures
        if "Unsupported URL" in error_msg:
            error_msg = "This URL is not supported. Please check the link and try again."
        elif "Video unavailable" in error_msg:
            error_msg = "This video is unavailable (may be private or deleted)."
        elif "HTTP Error 403" in error_msg:
            error_msg = "Access denied. The source is blocking the download."
        elif "ffmpeg" in error_msg.lower() and not FFMPEG_AVAILABLE:
            error_msg = (
                "FFmpeg is required for this format but was not found. "
                "Please install FFmpeg and restart the server."
            )

        _update_task(
            task_id,
            status="error",
            progress=0,
            error=error_msg,
            completed_at=datetime.now(timezone.utc).isoformat(),
        )
        logger.error("Task %s failed: %s", task_id, error_msg)
