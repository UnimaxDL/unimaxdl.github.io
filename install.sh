#!/usr/bin/env bash
set -euo pipefail

# UnimaxDL Native Installer for Linux (AppImage) & macOS (DMG)
# Official Source: https://unimaxdl.github.io

APP_VERSION="v1.0.0"
LINUX_FILE="UnimaxDL-${APP_VERSION}-linux.AppImage"
LINUX_SHA="6bbb7e141748ea162de83b981f75f86fe29236283af31457f42dce8fead5712e"
MAC_FILE="UnimaxDL-${APP_VERSION}-macos.dmg"
MAC_SHA="8e20b1ab0d62adf5f3e1f56a363cec1840e3bb504c4172a44bb95aff5a43c66f"

CDN_BASE="https://unimaxdl.github.io/downloads"
RELEASE_BASE="https://github.com/UnimaxDL/unimaxdl.github.io/releases/download/${APP_VERSION}"

verify_sha256() {
  local file="$1"
  local expected="$2"
  local actual=""
  if command -v sha256sum >/dev/null 2>&1; then
    actual="$(sha256sum "$file" | awk '{print $1}')"
  elif command -v shasum >/dev/null 2>&1; then
    actual="$(shasum -a 256 "$file" | awk '{print $1}')"
  else
    echo "Warning: No sha256 tool found; skipping checksum verification."
    return 0
  fi
  if [ "$actual" != "$expected" ]; then
    echo "Error: SHA-256 verification failed for $file"
    echo "Expected: $expected"
    echo "Actual:   $actual"
    exit 1
  fi
  echo "Verified SHA-256: $actual"
}

download_with_fallback() {
  local filename="$1"
  local dest="$2"
  echo "Downloading ${filename}..."
  if ! curl -fsSL "${CDN_BASE}/${filename}" -o "$dest"; then
    echo "Primary mirror slow, trying GitHub Releases..."
    curl -fsSL "${RELEASE_BASE}/${filename}" -o "$dest"
  fi
}

OS="$(uname -s)"
case "$OS" in
  Linux)
    INSTALL_DIR="${HOME}/.local/bin"
    mkdir -p "$INSTALL_DIR"
    TARGET="${INSTALL_DIR}/unimaxdl"
    download_with_fallback "$LINUX_FILE" "$TARGET"
    verify_sha256 "$TARGET" "$LINUX_SHA"
    chmod +x "$TARGET"
    echo ""
    echo "UnimaxDL installed to ${TARGET}"
    echo "Run it with: unimaxdl"
    ;;
  Darwin)
    TMP_DMG="$(mktemp -t unimaxdl.XXXXXX).dmg"
    download_with_fallback "$MAC_FILE" "$TMP_DMG"
    verify_sha256 "$TMP_DMG" "$MAC_SHA"
    echo ""
    echo "Downloaded verified macOS image to: ${TMP_DMG}"
    if command -v open >/dev/null 2>&1; then
      open "$TMP_DMG"
    fi
    ;;
  *)
    echo "Unsupported OS for install.sh: $OS"
    echo "Windows users should run install.ps1 or visit https://unimaxdl.github.io/download.html"
    exit 1
    ;;
esac
