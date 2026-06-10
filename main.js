const { app, BrowserWindow, ipcMain, session, Menu, clipboard, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Paths for persistent data
const userDataPath = path.join(app.getPath('appData'), 'NebulaBrowserUserData_Clean');
app.setPath('userData', userDataPath);
const bookmarksPath = path.join(userDataPath, 'bookmarks.json');
const historyPath = path.join(userDataPath, 'history.json');
const configPath = path.join(userDataPath, 'config.json');
const credentialsPath = path.join(userDataPath, 'credentials.json');
const drivePath = path.join(userDataPath, 'drive.json');

function readConfig() {
  return readJSON(configPath, { neonMode: false, agentMode: false, privacyMode: false });
}
function writeConfig(config) {
  writeJSON(configPath, config);
}

// File Logger System
const logFilePath = path.join(userDataPath, 'nebula_app.log');
function logMsg(msg) {
  try {
    fs.appendFileSync(logFilePath, `[${new Date().toISOString()}] ${msg}\n`, 'utf8');
  } catch {}
}
logMsg('Nebula Browser started');

process.on('uncaughtException', (err) => {
  logMsg('MAIN PROCESS UNCAUGHT EXCEPTION: ' + err.stack);
});

// Safari user agent - macOS Safari is fully trusted by Google
const SAFARI_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Override app-level UA fallback so Electron string is stripped globally
app.userAgentFallback = SAFARI_UA;

// Set user-agent switch
app.commandLine.appendSwitch('user-agent', SAFARI_UA);

// Helper to read JSON files safely
function readJSON(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading file:', filePath, err);
  }
  return defaultValue;
}

// Helper to write JSON files safely
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing file:', filePath, err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    title: 'Nebula Browser',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// IPC Handlers for Bookmarks and History
ipcMain.handle('get-bookmarks', async () => {
  return readJSON(bookmarksPath, []);
});

ipcMain.handle('save-bookmarks', async (event, bookmarks) => {
  writeJSON(bookmarksPath, bookmarks);
  return true;
});

ipcMain.handle('get-history', async () => {
  return readJSON(historyPath, []);
});

ipcMain.handle('save-history', async (event, history) => {
  writeJSON(historyPath, history);
  return true;
});

ipcMain.handle('get-credentials', async () => {
  return readJSON(credentialsPath, []);
});

ipcMain.handle('save-credential', async (event, cred) => {
  const credentials = readJSON(credentialsPath, []);
  // Avoid saving exact duplicates
  const exists = credentials.some(c => c.url === cred.url && c.username === cred.username && c.password === cred.password);
  if (!exists) {
    credentials.push(cred);
    writeJSON(credentialsPath, credentials);
  }
  return true;
});

ipcMain.handle('delete-credential', async (event, { url, username }) => {
  const credentials = readJSON(credentialsPath, []);
  const filtered = credentials.filter(c => !(c.url === url && c.username === username));
  writeJSON(credentialsPath, filtered);
  return true;
});

ipcMain.handle('get-drive-files', async () => {
  return readJSON(drivePath, []);
});

ipcMain.handle('save-drive-file', async (event, fileObj) => {
  const files = readJSON(drivePath, []);
  const nextId = files.reduce((max, f) => f.id > max ? f.id : max, 0) + 1;
  fileObj.id = nextId;
  files.push(fileObj);
  writeJSON(drivePath, files);
  return nextId;
});

ipcMain.handle('delete-drive-file', async (event, id) => {
  const files = readJSON(drivePath, []);
  const filtered = files.filter(f => f.id !== id);
  writeJSON(drivePath, filtered);
  return true;
});

// -------------------------------------------------------
// Logging Utilities
// -------------------------------------------------------

ipcMain.on('log-to-file', (event, msg) => {
  logMsg('RENDERER: ' + msg);
});

ipcMain.handle('open-gemini-signin', async () => {
  logMsg('IPC: open-gemini-signin handler invoked');
  try {
    const geminiSession = session.fromPartition('persist:nebula-gemini');
    geminiSession.setUserAgent(SAFARI_UA);
    const signInWin = new BrowserWindow({
      width: 480, height: 680,
      title: 'Sign in to Gemini',
      autoHideMenuBar: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true, session: geminiSession }
    });
    logMsg('IPC: BrowserWindow instantiated');

    signInWin.on('closed', () => {
      logMsg('IPC: Sign-in window closed. Sending sync signal.');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('gemini-signin-closed');
      }
    });

    signInWin.loadURL(
      'https://accounts.google.com/signin/v2/identifier?continue=https%3A%2F%2Fgemini.google.com&hl=en&flowName=GlifWebSignIn&flowEntry=ServiceLogin',
      { userAgent: SAFARI_UA }
    );
    logMsg('IPC: URL load initiated');
    return true;
  } catch (err) {
    logMsg('IPC ERROR: open-gemini-signin failed: ' + err.stack);
    throw err;
  }
});

ipcMain.handle('get-config', async () => {
  return readConfig();
});

ipcMain.handle('save-config', async (event, config) => {
  writeConfig(config);
  return true;
});

ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
  return true;
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
  return true;
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
  return true;
});

ipcMain.handle('capture-page', async (event, rect) => {
  try {
    const img = await mainWindow.webContents.capturePage(rect);
    return img.toDataURL();
  } catch (err) {
    logMsg('Error capturing page: ' + err.stack);
    return null;
  }
});

ipcMain.handle('copy-image-to-clipboard', async (event, dataUrl) => {
  try {
    const img = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(img);
    return true;
  } catch (err) {
    logMsg('Error copying to clipboard: ' + err.stack);
    return false;
  }
});

let pendingPermissions = new Map();
let pendingKeys = new Map(); // "origin:permission" -> array of callbacks/ids
let permissionRequestId = 0;
let sessionPermissions = new Map(); // origin -> Set of permissions
let timedPermissions = new Map(); // origin:permission -> expire timestamp

function checkPermission(origin, permission) {
  const config = readConfig();
  if (config.foreverPermissions && config.foreverPermissions[`${origin}:${permission}`]) {
    return true;
  }
  const sessionSet = sessionPermissions.get(origin);
  if (sessionSet && sessionSet.has(permission)) {
    return true;
  }
  const expireAt = timedPermissions.get(`${origin}:${permission}`);
  if (expireAt && expireAt > Date.now()) {
    return true;
  }
  return false;
}

function grantPermission(origin, permission, lifetime) {
  if (lifetime === 'forever') {
    const config = readConfig();
    config.foreverPermissions = config.foreverPermissions || {};
    config.foreverPermissions[`${origin}:${permission}`] = true;
    writeConfig(config);
  } else if (lifetime === 'session') {
    if (!sessionPermissions.has(origin)) {
      sessionPermissions.set(origin, new Set());
    }
    sessionPermissions.get(origin).add(permission);
  } else if (lifetime === 'timed') {
    timedPermissions.set(`${origin}:${permission}`, Date.now() + 5 * 60 * 1000);
  }
}

ipcMain.handle('respond-to-permission', async (event, { id, allowed, lifetime }) => {
  const req = pendingPermissions.get(id);
  if (req) {
    const { origin, permission, callbacks } = req;
    if (allowed) {
      grantPermission(origin, permission, lifetime);
      callbacks.forEach(cb => cb(true));
    } else {
      callbacks.forEach(cb => cb(false));
    }
    pendingPermissions.delete(id);
    pendingKeys.delete(`${origin}:${permission}`);
  }
  return true;
});

app.whenReady().then(() => {
  // Disable application menu completely to remove File, Edit, etc.
  Menu.setApplicationMenu(null);

  // -------------------------------------------------------
  // Override sessions to spoof a real Safari
  // This is required for Google sign-in to work in webviews
  // -------------------------------------------------------
  const sessionsToConfigure = [
    session.defaultSession,
    session.fromPartition('persist:nebula-gemini')
  ];

  const filter = { urls: ['http://*/*', 'https://*/*'] };

  sessionsToConfigure.forEach(sess => {
    sess.setUserAgent(SAFARI_UA);
    sess.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      const headers = details.requestHeaders || {};
      delete headers['X-Client-Data'];
      headers['User-Agent'] = SAFARI_UA;
      
      // Delete all Chromium Client Hint headers so Google treats us as a genuine Safari browser on Mac
      delete headers['Sec-CH-UA'];
      delete headers['Sec-CH-UA-Mobile'];
      delete headers['Sec-CH-UA-Platform'];
      
      callback({ requestHeaders: headers });
    });
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const config = readConfig();
    const requestingUrl = webContents.getURL();
    
    // Auto-allow clipboard access or any request from the trusted main app window (file://)
    if (requestingUrl.startsWith('file://') || permission === 'clipboard-sanitized-write' || permission === 'clipboard-read') {
      return callback(true);
    }

    let origin;
    try {
      origin = new URL(requestingUrl).origin;
    } catch (err) {
      origin = requestingUrl;
    }

    if (checkPermission(origin, permission)) {
      return callback(true);
    }

    const key = `${origin}:${permission}`;
    if (pendingKeys.has(key)) {
      pendingKeys.get(key).push(callback);
      return;
    }

    const id = ++permissionRequestId;
    pendingPermissions.set(id, { callback, origin, permission, callbacks: [callback] });
    pendingKeys.set(key, pendingPermissions.get(id).callbacks);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('request-permission', {
        id,
        url: requestingUrl,
        permission: permission,
        privacyMode: !!config.privacyMode
      });
    } else {
      callback(false);
    }
  });

  const neonCSSPath = path.join(__dirname, 'neon-inject.css');
  const neonCSS = fs.existsSync(neonCSSPath) ? fs.readFileSync(neonCSSPath, 'utf8') : '';

  // Handle new-window events for OAuth sign-in popups
  app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      // If it's a Google auth URL, open in a proper BrowserWindow
      if (url.includes('accounts.google.com') || url.includes('google.com/o/oauth2')) {
        const authWin = new BrowserWindow({
          width: 500,
          height: 650,
          title: 'Sign in with Google',
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            session: session.fromPartition('persist:nebula-gemini')
          }
        });
        authWin.loadURL(url);
        return { action: 'deny' };
      }
      return { action: 'allow' };
    });
  });

  createWindow();

  app.on('activate', function () {
    if (mainWindow === null) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
