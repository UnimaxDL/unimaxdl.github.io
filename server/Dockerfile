# ===========================================================================
# UnimaxDL Server — Multi-stage Docker Build
# ===========================================================================
# Build:  docker build -t unimaxdl-server .
# Run:    docker run -p 8000:8000 -v unimaxdl_downloads:/app/downloads unimaxdl-server

# ---- Stage 1: builder (install Python deps into a venv) -------------------
FROM python:3.11-slim AS builder

WORKDIR /build

COPY requirements.txt .
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# ---- Stage 2: runtime ----------------------------------------------------
FROM python:3.11-slim

LABEL maintainer="UnimaxDL" \
      description="Universal Media Downloader — local API server" \
      version="1.0.0"

# Install ffmpeg (required for merging video+audio and audio conversion)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy the pre-built venv from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Copy application code
COPY analytics.py downloader.py server.py start.py ./

# Create directories
RUN mkdir -p downloads static

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/api/ping').raise_for_status()" || exit 1

CMD ["python", "start.py"]
