const { contextBridge, ipcRenderer } = require('electron');
const on = ch => cb => ipcRenderer.on(ch, (_, m) => cb(m));
contextBridge.exposeInMainWorld('tnt', {
  invoke: (ch, args) => ipcRenderer.invoke(ch, args),
  onLog: on('log'), onProgress: on('progress'), onClosed: on('closed'), onUpdateProgress: on('update-progress'), onSiteCode: on('site-code'), onPackCode: on('pack-code'),
  platform: process.platform,
});
