# UnimaxDL Setup & Deployment Guide

Welcome to the complete installation and setup guide for **UnimaxDL**.

---

## 1. Quickest Option: Web (unimaxdl.github.io)

You don't need to install anything if you just want to test or download via a connected backend:
1. Visit [https://unimaxdl.github.io](https://unimaxdl.github.io).
2. Click the ⚙️ icon in the header to point to your PC backend (`http://localhost:8000`) or Cloud API.

---

## 2. Running the Local Backend on PC (Windows / Mac / Linux)

### Prerequisites
- **Python 3.10+** (Python 3.11 recommended)
- **FFmpeg**: Required for remuxing high-definition video (1080p+) and extracting audio (MP3).
  - **Windows**: `winget install Gyan.FFmpeg` or download from [ffmpeg.org](https://ffmpeg.org/download.html).
  - **macOS**: `brew install ffmpeg`
  - **Linux (Ubuntu/Debian)**: `sudo apt update && sudo apt install ffmpeg`

### Steps
1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS / Linux:
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Launch the server:**
   ```bash
   python start.py
   ```
   The script will:
   - Verify FFmpeg availability.
   - Detect your local LAN IP (e.g. `192.168.1.100`).
   - Open `http://127.0.0.1:8000` in your default browser.
   - Print the LAN address for phone connections (`http://192.168.1.100:8000`).

---

## 3. Running with Docker / Docker Compose

If you have Docker installed, you can spin up UnimaxDL with one command:

```bash
cd server
docker-compose up -d
```

- Accessible at: `http://localhost:8000`
- Downloaded media persists in `./downloads` on your host machine.

---

## 4. Connecting Android Phone to Local PC

1. Ensure your PC and phone are on the **same Wi-Fi network**.
2. Run `python start.py` on your PC and note the **Mobile Access URL** (e.g., `http://192.168.1.45:8000`).
3. Open the UnimaxDL Web App or Android APK on your phone.
4. Tap the ⚙️ Settings icon and set the Server URL to `http://192.168.1.45:8000`.
5. You're ready to download at full PC speeds!
