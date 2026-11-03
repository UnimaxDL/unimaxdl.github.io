"""
UnimaxDL Analytics Reporter
============================
Fire-and-forget anonymous event reporting to Supabase.
All calls are non-blocking and silently swallow errors so they
never interfere with the download pipeline.
"""

from __future__ import annotations

import logging
import os
import platform
import threading
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger("unimaxdl.analytics")

# ---------------------------------------------------------------------------
# Configuration — set via environment or replace these placeholders
# ---------------------------------------------------------------------------
SUPABASE_URL: str = os.getenv(
    "SUPABASE_URL", "https://olxgfytiyiupfzthoris.supabase.co"
)
SUPABASE_KEY: str = os.getenv(
    "SUPABASE_KEY", "sb_publishable_n836xYAnIUD0d0qIyoXLTQ_GQ0KJSH0"
)
ANALYTICS_ENABLED: bool = (
    os.getenv("UNIMAXDL_ANALYTICS", "true").lower() == "true"
)

_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

_TABLE_DOWNLOADS = "download_events"
_TABLE_SERVER = "server_events"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _post(table: str, payload: Dict[str, Any]) -> None:
    """POST a row to a Supabase REST table endpoint.

    Runs inside a daemon thread so the caller never blocks.
    Errors are logged at DEBUG level and otherwise ignored.
    """
    if not ANALYTICS_ENABLED:
        return

    def _send() -> None:
        try:
            url = f"{SUPABASE_URL}/rest/v1/{table}"
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(url, json=payload, headers=_HEADERS)
                resp.raise_for_status()
                logger.debug("Analytics event sent to %s: %s", table, resp.status_code)
        except Exception as exc:  # noqa: BLE001
            logger.debug("Analytics send failed (ignored): %s", exc)

    t = threading.Thread(target=_send, daemon=True)
    t.start()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def report_download(
    source_site: str,
    media_type: str,
    quality: str,
    title: str,
    url: str,
    file_size_mb: float,
    duration_sec: Optional[float] = None,
) -> None:
    """Report a completed download event.

    Parameters
    ----------
    source_site:
        Domain of the source (e.g. ``youtube.com``).
    media_type:
        ``"video"`` or ``"audio"``.
    quality:
        Human-readable quality label (e.g. ``"1080p"``, ``"320kbps"``).
    title:
        Media title.
    url:
        Original URL.
    file_size_mb:
        Final file size in megabytes.
    duration_sec:
        Media duration in seconds, if known.
    """
    _post(
        _TABLE_DOWNLOADS,
        {
            "source_site": source_site,
            "media_type": media_type,
            "quality": quality,
            "title": title[:256] if title else "",
            "url": url[:2048] if url else "",
            "file_size_mb": round(file_size_mb, 2),
            "duration_sec": round(duration_sec, 1) if duration_sec else None,
            "platform": platform.system(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


def report_server_start(plat: Optional[str] = None) -> None:
    """Report that the server has started.

    Parameters
    ----------
    plat:
        Override the platform string (default: auto-detected).
    """
    _post(
        _TABLE_SERVER,
        {
            "event": "server_start",
            "platform": plat or platform.system(),
            "python_version": platform.python_version(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
