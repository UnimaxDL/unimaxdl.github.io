"""
UnimaxDL — Launcher Script
============================
Entry point that boots the FastAPI server via **uvicorn**, prints a
startup banner with LAN details, runs pre-flight checks, and optionally
opens the browser.
"""

from __future__ import annotations

import os
import platform
import shutil
import socket
import sys
import threading
import time
import webbrowser

import uvicorn


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_lan_ip() -> str:
    """Best-effort LAN IP detection (no external calls)."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            # Doesn't actually send data — just forces the OS to pick
            # the right interface.
            s.connect(("10.254.254.254", 1))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"


def check_ffmpeg() -> bool:
    """Return True if ffmpeg is on PATH, print a warning otherwise."""
    if shutil.which("ffmpeg"):
        print("  [OK] FFmpeg found")
        return True
    print("  [WARN] FFmpeg NOT found -- video merging and audio conversion")
    print("    will not work.  Install from https://ffmpeg.org/download.html")
    return False


def check_ytdlp() -> None:
    """Print the installed yt-dlp version."""
    try:
        import yt_dlp  # noqa: E402

        print(f"  [OK] yt-dlp {yt_dlp.version.__version__}")
    except Exception:
        print("  [ERR] yt-dlp not importable -- downloads will fail!")


def open_browser_delayed(url: str, delay: float = 1.2) -> None:
    """Open the default browser after *delay* seconds (non-blocking)."""

    def _open() -> None:
        time.sleep(delay)
        try:
            webbrowser.open(url)
        except Exception:
            pass

    t = threading.Thread(target=_open, daemon=True)
    t.start()


# ---------------------------------------------------------------------------
# Banner
# ---------------------------------------------------------------------------

def print_banner(lan_ip: str) -> None:
    print()
    print("  ======================================================")
    print("    UnimaxDL -- Universal Media Downloader Server v1.0.0")
    print("    100% Ad-Free * Zero Daemons * Zero Telemetry")
    print()
    print(f"    PC Browser:     http://127.0.0.1:8000")
    print(f"    Mobile Access:  http://{lan_ip}:8000")
    print(f"    API Endpoint:   http://{lan_ip}:8000/api")
    print("  ======================================================")
    print()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    lan_ip = get_lan_ip()
    print_banner(lan_ip)

    print("  Pre-flight checks:")
    check_ffmpeg()
    check_ytdlp()
    print()

    # Optional analytics report
    try:
        from analytics import report_server_start  # noqa: E402

        report_server_start(platform.system())
    except Exception:
        pass

    # Auto-open browser
    open_browser_delayed("http://127.0.0.1:8000")

    # Dynamic port support for cloud environments (Render, Railway, Heroku)
    port = int(os.environ.get("PORT", 8000))

    # Run the ASGI server
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True,
    )


if __name__ == "__main__":
    main()
