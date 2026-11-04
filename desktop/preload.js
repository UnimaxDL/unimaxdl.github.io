const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld('UnimaxNative', {
  platform: process.platform,
  isNativeDesktop: true,
  readClipboard: () => clipboard.readText(),
  downloadLocal: (url, options) => ipcRenderer.invoke('native-download', { url, options }),
  openFolder: (path) => ipcRenderer.send('open-folder', path)
});
