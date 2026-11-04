const { app, BrowserWindow, ipcMain, shell, clipboard } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let lastClipboardText = '';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'UnimaxDL — Universal Media Downloader',
    backgroundColor: '#07070a',
    icon: path.join(__dirname, '../assets/images/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the production web application
  mainWindow.loadURL('https://unimaxdl.github.io/');

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith('https://unimaxdl.github.io')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Clipboard Watcher for auto-detecting copied URLs
  setInterval(() => {
    try {
      const text = clipboard.readText().trim();
      if (text && text !== lastClipboardText) {
        lastClipboardText = text;
        const isMediaUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|twitter\.com|x\.com|facebook\.com)\//i.test(text);
        if (isMediaUrl && mainWindow) {
          mainWindow.webContents.send('clipboard-media-detected', text);
        }
      }
    } catch (e) {}
  }, 1500);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Native yt-dlp execution bridge for 4K / 8K local downloads
ipcMain.handle('native-download', async (event, { url, options }) => {
  return new Promise((resolve, reject) => {
    const downloadDir = app.getPath('downloads');
    const args = [
      url,
      '-P', downloadDir,
      '-o', '%(title)s.%(ext)s',
      '--no-playlist'
    ];

    if (options && options.format === 'mp3') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else if (options && options.quality === 'best') {
      args.push('-f', 'bestvideo+bestaudio/best', '--merge-output-format', 'mp4');
    }

    const proc = spawn('yt-dlp', args);
    proc.on('close', (code) => {
      if (code === 0) resolve({ success: true, dir: downloadDir });
      else reject(new Error(`Download process exited with code ${code}`));
    });
  });
});

ipcMain.on('open-folder', (event, folderPath) => {
  shell.openPath(folderPath || app.getPath('downloads'));
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
