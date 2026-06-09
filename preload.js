const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  saveBookmarks: (bookmarks) => ipcRenderer.invoke('save-bookmarks', bookmarks),
  getHistory: () => ipcRenderer.invoke('get-history'),
  saveHistory: (history) => ipcRenderer.invoke('save-history', history),
  openGeminiSignIn: () => ipcRenderer.invoke('open-gemini-signin'),
  importChromeCookies: () => ipcRenderer.invoke('import-chrome-cookies'),
  logToFile: (msg) => ipcRenderer.send('log-to-file', msg),
  onGeminiSignInClosed: (callback) => ipcRenderer.on('gemini-signin-closed', (event, ...args) => callback(...args)),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  restartApp: () => ipcRenderer.invoke('restart-app'),
  onRequestPermission: (callback) => ipcRenderer.on('request-permission', (event, ...args) => callback(...args)),
  respondToPermission: (id, allowed) => ipcRenderer.invoke('respond-to-permission', { id, allowed })
});
