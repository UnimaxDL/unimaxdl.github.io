# Changelog

All notable changes to the **UnimaxDL** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-03

### Added
- **Web App**: Initial release of static web app hosted at `unimaxdl.github.io`.
- **Platform Landing Pages**: Dedicated SEO pages for YouTube, TikTok, and Instagram.
- **Python Backend Server**:
  - Upgraded FastAPI service with thread-safe task storage.
  - Bounded download concurrency (`ThreadPoolExecutor(max_workers=3)`).
  - Pre-flight FFmpeg and yt-dlp version verification.
  - Path traversal protection on media deletion.
  - Anonymous privacy-first analytics event dispatcher.
- **Media Processing Core**:
  - Video downloads up to 4K / 8K UHD.
  - Audio extraction to MP3 (320, 192, 128 kbps) and original M4A.
  - Real-time download progress tracking (speed, percent, ETA).
- **Client Architecture**:
  - Configurable server settings modal with ping diagnostics.
  - Native Android `AndroidBridge` and share intent readiness.
  - Docker and Docker Compose deployment support.
- **Documentation**: Comprehensive setup guide, API references, terms of service, and privacy policy.
