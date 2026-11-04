# UnimaxDL Desktop Application

Native desktop client for Windows, macOS, and Linux.

## Key Advantages
- **Unlimited 4K / 8K / 60FPS:** Leverages native system threads and local `yt-dlp` to download high-bitrate media without browser RAM limitations.
- **Smart Clipboard Watcher:** Automatically catches video links copied from your browser.
- **Batch Downloads:** Queue entire YouTube playlists and user channels with 1 click.
- **Zero Server Costs:** Runs 100% on the user's computer.

## Quick Start
```bash
cd desktop
npm install
npm run start
```

## Packaging Installers
- **Windows (.exe / .msi):** `npm run pack:win`
- **macOS (.dmg):** `npm run pack:mac`
- **Linux (.AppImage):** `npm run pack:linux`
