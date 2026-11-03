# ===========================================================================
# UnimaxDL Root Dockerfile (Cloud Deployment for Render / Railway / Fly)
# ===========================================================================
FROM python:3.11-slim AS builder

WORKDIR /build

COPY server/requirements.txt .
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim

LABEL maintainer="UnimaxDL" \
      description="Universal Media Downloader Server" \
      version="1.0.0"

# Install ffmpeg for media merging and extraction
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Copy server code
COPY server/analytics.py server/downloader.py server/server.py server/start.py ./
RUN mkdir -p downloads static

# Copy frontend static files into static directory
COPY server/static/ ./static/

EXPOSE 8000
ENV PORT=8000

CMD ["python", "start.py"]
