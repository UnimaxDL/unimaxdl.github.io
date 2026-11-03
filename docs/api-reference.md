# UnimaxDL REST API Reference

The UnimaxDL server exposes a clean, lightweight REST API for analyzing and downloading media.

**Base URL:** `http://127.0.0.1:8000/api` (Local) or your configured server.

---

### 1. Health Ping
- **Endpoint:** `GET /api/ping`
- **Response:**
  ```json
  {
    "status": "ok",
    "name": "UnimaxDL Server",
    "version": "1.0.0"
  }
  ```

---

### 2. Analyze URL
Extracts metadata, resolutions, and available formats from any media link.

- **Endpoint:** `POST /api/analyze`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "title": "Sample Video Title",
      "thumbnail": "https://...",
      "duration": "03:32",
      "duration_seconds": 212,
      "uploader": "Official Channel",
      "extractor": "Youtube",
      "view_count": 1542000,
      "video_formats": [
        { "resolution": "1080p", "height": 1080, "ext": "mp4", "filesize_formatted": "45.2 MB", "fps": 60 },
        { "resolution": "720p", "height": 720, "ext": "mp4", "filesize_formatted": "22.1 MB", "fps": 30 }
      ],
      "audio_formats": [
        { "id": "mp3-320", "label": "MP3 High Quality", "bitrate": "320k", "ext": "mp3" },
        { "id": "mp3-192", "label": "MP3 Standard Quality", "bitrate": "192k", "ext": "mp3" }
      ]
    }
  }
  ```

---

### 3. Start Download Task
Enqueues a background download task.

- **Endpoint:** `POST /api/download`
- **Request Body:**
  ```json
  {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "type": "video",
    "quality": "1080p",
    "title": "Sample Video",
    "thumbnail": "https://..."
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "task_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
  ```

---

### 4. List Active Tasks
- **Endpoint:** `GET /api/tasks`
- **Response:**
  ```json
  {
    "tasks": [
      {
        "id": "9b1deb4d-...",
        "title": "Sample Video",
        "status": "downloading",
        "percent": 45.6,
        "speed": "3.8 MB/s",
        "eta": "12s",
        "downloaded": "20.1 MB",
        "total": "44.2 MB",
        "type": "video",
        "quality": "1080p"
      }
    ]
  }
  ```

---

### 5. Media Library & Management
- **Endpoint:** `GET /api/library` — Lists files currently stored in `./downloads`.
- **Endpoint:** `DELETE /api/library/{filename}` — Deletes a file safely from disk.
- **Endpoint:** `GET /media/{filename}` — Streams or downloads the file directly.
