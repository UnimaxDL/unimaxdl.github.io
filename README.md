<!-- Hero Banner -->
<div align="center">

  <img src="assets/images/icon2.png" alt="UnimaxDL Logo" width="140">

  # UnimaxDL

  **Download Anything. Everywhere. For Free.**

  The open-source universal media downloader — 1000+ sites, zero ads, zero tracking.

  [![GitHub Stars](https://img.shields.io/github/stars/UnimaxDL/unimaxdl.github.io?style=for-the-badge&logo=github&color=f59e0b)](https://github.com/UnimaxDL/unimaxdl.github.io/stargazers)
  [![License](https://img.shields.io/github/license/UnimaxDL/unimaxdl.github.io?style=for-the-badge&color=10b981)](LICENSE)
  [![Downloads](https://img.shields.io/github/downloads/UnimaxDL/unimaxdl.github.io/total?style=for-the-badge&color=6366f1)](https://github.com/UnimaxDL/unimaxdl.github.io/releases)
  [![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Windows%20%7C%20Mac%20%7C%20Linux%20%7C%20Android-blue?style=for-the-badge)](https://unimaxdl.github.io)

  <br/>

  <img src="assets/images/hero-screenshot.png" alt="UnimaxDL Screenshot" width="800">

  <br/><br/>

  <a href="https://unimaxdl.github.io"><b>🌐 Try Online</b></a> · 
  <a href="https://unimaxdl.github.io/download.html"><b>📥 Download App</b></a> · 
  <a href="#-quick-start"><b>🚀 Quick Start</b></a> · 
  <a href="https://discord.gg/unimaxdl"><b>💬 Discord</b></a>

</div>

---

## ✨ Features

<table>
  <tr>
    <td align="center" width="20%">🌍<br/><b>1000+ Sites</b><br/><sub>YouTube, TikTok, Instagram, Twitter/X, Reddit, and more</sub></td>
    <td align="center" width="20%">📺<br/><b>4K / 8K</b><br/><sub>Download at the highest available resolution</sub></td>
    <td align="center" width="20%">🎵<br/><b>MP3 Converter</b><br/><sub>Extract audio at 320/192/128 kbps</sub></td>
    <td align="center" width="20%">🚫<br/><b>Zero Ads</b><br/><sub>No ads, no popups, no dark patterns — ever</sub></td>
    <td align="center" width="20%">🔓<br/><b>Open Source</b><br/><sub>MIT licensed, fully auditable code</sub></td>
  </tr>
  <tr>
    <td align="center">💻<br/><b>Cross Platform</b><br/><sub>Web, Windows, Mac, Linux, Android</sub></td>
    <td align="center">🔒<br/><b>Private</b><br/><sub>No tracking, no cookies, no data collection</sub></td>
    <td align="center">📦<br/><b>Batch Download</b><br/><sub>Download playlists and channels in bulk</sub></td>
    <td align="center">📋<br/><b>Clipboard Watcher</b><br/><sub>Auto-detect copied URLs and start downloads</sub></td>
    <td align="center">📲<br/><b>Share Intent</b><br/><sub>Share from any Android app to download instantly</sub></td>
  </tr>
</table>

---

## 🖼️ Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center"><img src="assets/images/screenshot-web.png" alt="Web UI" width="280"><br/><b>Web Interface</b></td>
      <td align="center"><img src="assets/images/screenshot-desktop.png" alt="Desktop App" width="280"><br/><b>Desktop App</b></td>
      <td align="center"><img src="assets/images/screenshot-android.png" alt="Android App" width="280"><br/><b>Android App</b></td>
    </tr>
  </table>
</div>

---

## 🚀 Quick Start

### 1. 🌐 Web (Instant — No Install)

Visit **[unimaxdl.github.io](https://unimaxdl.github.io)** → Paste a URL → Download.

That's it. No signup, no install, no BS.

### 2. 💻 Desktop App

1. Go to [**Releases**](https://github.com/UnimaxDL/unimaxdl.github.io/releases)
2. Download the installer for your OS (`.exe` / `.dmg` / `.AppImage`)
3. Install and launch
4. Paste a URL → Pick quality → Download

### 3. 🖥️ Self-Hosted Server

```bash
git clone https://github.com/UnimaxDL/unimaxdl.github.io.git
cd unimaxdl.github.io/server
pip install -r requirements.txt
python start.py
```

Server runs at `http://localhost:8000` — open it in your browser and start downloading.

---

## 🐳 Docker

Spin up UnimaxDL in one command:

```bash
docker-compose up -d
```

Or pull directly:

```bash
docker run -d -p 8000:8000 --name unimaxdl ghcr.io/unimaxdl/server:latest
```

The server will be available at `http://localhost:8000`.

<details>
<summary><b>docker-compose.yml</b></summary>

```yaml
version: "3.8"
services:
  unimaxdl:
    image: ghcr.io/unimaxdl/server:latest
    container_name: unimaxdl
    ports:
      - "8000:8000"
    volumes:
      - ./downloads:/app/downloads
    restart: unless-stopped
    environment:
      - MAX_CONCURRENT_DOWNLOADS=3
      - DOWNLOAD_DIR=/app/downloads
```

</details>

---

## 📱 Android

1. Download the latest APK from [**Releases**](https://github.com/UnimaxDL/unimaxdl.github.io/releases)
2. Enable **"Install from Unknown Sources"** in your device settings
3. Install the APK
4. Open any app (YouTube, TikTok, Instagram…) → Hit **Share** → Select **UnimaxDL**

The video downloads directly to your device. No root required.

---

## 🌐 Supported Sites

UnimaxDL supports **1000+ websites** via [yt-dlp](https://github.com/yt-dlp/yt-dlp). Here are the most popular:

| Platform | Video | Audio | Playlists | Stories/Reels |
|:---------|:-----:|:-----:|:---------:|:-------------:|
| 🔴 YouTube | ✅ | ✅ | ✅ | — |
| 🎵 TikTok | ✅ | ✅ | — | ✅ |
| 📸 Instagram | ✅ | ✅ | — | ✅ |
| 📘 Facebook | ✅ | ✅ | — | ✅ |
| 🐦 Twitter / X | ✅ | ✅ | — | — |
| 🟠 Reddit | ✅ | ✅ | — | — |
| 🎬 Vimeo | ✅ | ✅ | ✅ | — |
| 🎧 SoundCloud | — | ✅ | ✅ | — |
| 📹 Dailymotion | ✅ | ✅ | ✅ | — |
| 🟣 Twitch | ✅ | ✅ | — | — |
| 📌 Pinterest | ✅ | — | — | — |
| 📺 Bilibili | ✅ | ✅ | ✅ | — |

> **…and 1000+ more** — if yt-dlp supports it, UnimaxDL supports it.

---

## 🔧 API Reference

UnimaxDL exposes a REST API for programmatic access:

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/ping` | Health check — returns `{ "status": "ok" }` |
| `POST` | `/api/analyze` | Analyze a URL → returns available formats, resolutions, metadata |
| `POST` | `/api/download` | Start a download task with specified format and quality |
| `GET` | `/api/tasks` | List all active and completed download tasks |
| `GET` | `/api/tasks/:id` | Get status of a specific download task |
| `GET` | `/api/library` | Browse downloaded media library |
| `DELETE` | `/api/library/:id` | Remove a file from the library |

**Quick example:**

```bash
# Analyze a video
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Download as MP4 (best quality)
curl -X POST http://localhost:8000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "format": "mp4", "quality": "best"}'
```

> 📖 Full API docs: [`docs/api-reference.md`](docs/api-reference.md)

---

## 🏗️ Project Structure

```
unimaxdl.github.io/
├── index.html              # Main web app (GitHub Pages)
├── download.html           # Download page for native apps
├── blog/                   # Blog posts
├── assets/
│   ├── css/                # Stylesheets
│   ├── js/                 # Frontend JavaScript
│   └── images/             # Logos, screenshots, icons
├── server/                 # Self-hosted Python backend
│   ├── start.py            # Entry point
│   ├── requirements.txt    # Python dependencies
│   ├── api/                # FastAPI route handlers
│   ├── core/               # yt-dlp wrapper, config, utils
│   └── downloads/          # Downloaded media storage
├── desktop/                # Tauri desktop app (Windows/Mac/Linux)
│   ├── src-tauri/          # Rust backend
│   └── src/                # Frontend (web)
├── android/                # Android app
│   └── app/                # Android Studio project
├── docs/                   # Documentation
│   ├── setup-guide.md
│   ├── api-reference.md
│   ├── privacy-policy.md
│   └── terms-of-service.md
├── .github/
│   ├── workflows/          # CI/CD workflows
│   ├── ISSUE_TEMPLATE/     # Bug & feature templates
│   └── FUNDING.yml
├── docker-compose.yml
├── CONTRIBUTING.md
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── LICENSE                 # MIT
└── README.md               # ← You are here
```

---

## 🤝 Contributing

Contributions are what make open-source great. Whether it's fixing a typo, adding a feature, or reporting a bug — **every contribution matters**.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

> 📖 Read the full [**Contributing Guide**](CONTRIBUTING.md) before getting started.

---

## ⭐ Star History

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=UnimaxDL/unimaxdl.github.io&type=Date)](https://star-history.com/#UnimaxDL/unimaxdl.github.io&Date)

</div>

**If UnimaxDL saves you time, give it a ⭐ — it helps more people discover it.**

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

You're free to use, modify, and distribute UnimaxDL. Attribution is appreciated but not required.

---

## 👤 Author

<div align="center">

**Built with ❤️ by [Atomic Dhruba](https://github.com/AtomicDhruba)**

[![GitHub](https://img.shields.io/badge/GitHub-AtomicDhruba-181717?style=for-the-badge&logo=github)](https://github.com/AtomicDhruba)
[![Website](https://img.shields.io/badge/Website-unimaxdl.github.io-4f46e5?style=for-the-badge&logo=googlechrome&logoColor=white)](https://unimaxdl.github.io)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/unimaxdl)

</div>

---

<div align="center">
  <sub>UnimaxDL is not affiliated with YouTube, TikTok, Instagram, or any other platform. Use responsibly and respect copyright laws.</sub>
</div>
