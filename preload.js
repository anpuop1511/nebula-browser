const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  saveBookmarks: (bookmarks) => ipcRenderer.invoke('save-bookmarks', bookmarks),
  getHistory: () => ipcRenderer.invoke('get-history'),
  saveHistory: (history) => ipcRenderer.invoke('save-history', history),
  openGeminiSignIn: () => ipcRenderer.invoke('open-gemini-signin'),
  logToFile: (msg) => ipcRenderer.send('log-to-file', msg),
  onGeminiSignInClosed: (callback) => ipcRenderer.on('gemini-signin-closed', (event, ...args) => callback(...args)),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  restartApp: () => ipcRenderer.invoke('restart-app'),
  onRequestPermission: (callback) => ipcRenderer.on('request-permission', (event, ...args) => callback(...args)),
  respondToPermission: (id, allowed, lifetime) => ipcRenderer.invoke('respond-to-permission', { id, allowed, lifetime }),
  capturePage: (rect) => ipcRenderer.invoke('capture-page', rect),
  copyImageToClipboard: (dataUrl) => ipcRenderer.invoke('copy-image-to-clipboard', dataUrl),
  getCredentials: () => ipcRenderer.invoke('get-credentials'),
  saveCredential: (cred) => ipcRenderer.invoke('save-credential', cred),
  deleteCredential: (data) => ipcRenderer.invoke('delete-credential', data),
  getDriveFiles: () => ipcRenderer.invoke('get-drive-files'),
  saveDriveFile: (fileObj) => ipcRenderer.invoke('save-drive-file', fileObj),
  deleteDriveFile: (id) => ipcRenderer.invoke('delete-drive-file', id),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close')
});
