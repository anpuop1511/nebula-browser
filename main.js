const { app, BrowserWindow, ipcMain, session, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Paths for persistent data
const userDataPath = app.getPath('userData');
const bookmarksPath = path.join(userDataPath, 'bookmarks.json');
const historyPath = path.join(userDataPath, 'history.json');
const configPath = path.join(userDataPath, 'config.json');

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
    frame: true,
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

// -------------------------------------------------------
// Import Google cookies from Chrome so Gemini sign-in works
// -------------------------------------------------------
async function importAllBrowserCookies(targetSession) {
  const { spawnSync } = require('child_process');
  const os = require('os');
  const crypto = require('crypto');
  const Database = require('better-sqlite3');

  const localAppData = process.env.LOCALAPPDATA;
  const browsers = [
    {
      name: 'Chrome',
      basePath: path.join(localAppData, 'Google', 'Chrome', 'User Data')
    },
    {
      name: 'Edge',
      basePath: path.join(localAppData, 'Microsoft', 'Edge', 'User Data')
    },
    {
      name: 'Brave',
      basePath: path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data')
    }
  ];

  let totalImported = 0;
  let errors = [];

  for (const browser of browsers) {
    const localStatePath = path.join(browser.basePath, 'Local State');
    if (!fs.existsSync(localStatePath)) continue;

    try {
      // Read encrypted master key
      const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
      const encryptedKeyB64 = localState.os_crypt.encrypted_key;
      if (!encryptedKeyB64) continue;
      const encryptedKeyWithPrefix = Buffer.from(encryptedKeyB64, 'base64');
      const dpapiEncrypted = encryptedKeyWithPrefix.slice(5); // remove "DPAPI" prefix

      // Decrypt master key
      const dpapiB64 = dpapiEncrypted.toString('base64');
      const psScriptPath = path.join(os.tmpdir(), 'nebula_dpapi.ps1');
      fs.writeFileSync(psScriptPath, `
param([string]$enc)
Add-Type -AssemblyName System.Security
$bytes = [Convert]::FromBase64String($enc)
$dec = [System.Security.Cryptography.ProtectedData]::Unprotect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
[Convert]::ToBase64String($dec)
`);
      const psResult = spawnSync('powershell', [
        '-NonInteractive', '-ExecutionPolicy', 'Bypass',
        '-File', psScriptPath,
        '-enc', dpapiB64
      ], { encoding: 'utf8' });
      try { fs.unlinkSync(psScriptPath); } catch {}
      if (psResult.status !== 0 || !psResult.stdout.trim()) {
        continue;
      }
      const masterKey = Buffer.from(psResult.stdout.trim(), 'base64');

      // Scan standard profiles
      const profiles = ['Default', 'Profile 1', 'Profile 2', 'Profile 3', 'Profile 4', 'Profile 5'];
      for (const profile of profiles) {
        const cookiePaths = [
          path.join(browser.basePath, profile, 'Network', 'Cookies'),
          path.join(browser.basePath, profile, 'Cookies')
        ];
        
        let cookiePath = null;
        for (const p of cookiePaths) {
          if (fs.existsSync(p)) {
            cookiePath = p;
            break;
          }
        }

        if (!cookiePath) continue;

        // Copy database file so it isn't locked by browser
        const tempPath = path.join(os.tmpdir(), `nebula_${browser.name}_${profile}_cookies_${Date.now()}.db`);
        try {
          fs.copyFileSync(cookiePath, tempPath);
        } catch (copyErr) {
          // If fs.copyFileSync fails because the database is locked (EBUSY), use cmd's copy command which can read active locked files
          const { execSync } = require('child_process');
          try {
            execSync(`cmd.exe /c copy /y "${cookiePath}" "${tempPath}"`, { stdio: 'ignore' });
          } catch (cmdErr) {
            errors.push(`${browser.name} (${profile}) file copy failed: ${cmdErr.message}`);
            continue;
          }
        }

        try {
          const db = new Database(tempPath, { readonly: true });
          const rows = db.prepare(`
            SELECT host_key, name, value, encrypted_value, path, expires_utc, is_secure, is_httponly, samesite
            FROM cookies
            WHERE host_key LIKE '%.google.com'
          `).all();
          db.close();

          for (const row of rows) {
            let cookieValue = row.value;

            if (row.encrypted_value && row.encrypted_value.length > 3) {
              const encBuf = Buffer.from(row.encrypted_value);
              const prefix = encBuf.slice(0, 3).toString('ascii');
              if (prefix === 'v10' || prefix === 'v11') {
                try {
                  const iv = encBuf.slice(3, 15);
                  const tag = encBuf.slice(-16);
                  const ciphertext = encBuf.slice(15, -16);
                  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
                  decipher.setAuthTag(tag);
                  cookieValue = decipher.update(ciphertext, null, 'utf8') + decipher.final('utf8');
                } catch { continue; }
              }
            }

            if (!cookieValue) continue;

            const domain = row.host_key;
            const urlHost = domain.startsWith('.') ? domain.slice(1) : domain;
            const expirySeconds = row.expires_utc
              ? Math.floor(row.expires_utc / 1000000 - 11644473600)
              : undefined;

            try {
              // Inject into Gemini sidebar
              await targetSession.cookies.set({
                url: `https://${urlHost}`,
                name: row.name,
                value: cookieValue,
                domain: domain,
                path: row.path || '/',
                secure: !!row.is_secure,
                httpOnly: !!row.is_httponly,
                sameSite: row.samesite === 2 ? 'strict' : row.samesite === 1 ? 'lax' : 'no_restriction',
                ...(expirySeconds ? { expirationDate: expirySeconds } : {})
              });

              // Also inject cookies into Electron's default session (for normal browser tabs)
              await session.defaultSession.cookies.set({
                url: `https://${urlHost}`,
                name: row.name,
                value: cookieValue,
                domain: domain,
                path: row.path || '/',
                secure: !!row.is_secure,
                httpOnly: !!row.is_httponly,
                sameSite: row.samesite === 2 ? 'strict' : row.samesite === 1 ? 'lax' : 'no_restriction',
                ...(expirySeconds ? { expirationDate: expirySeconds } : {})
              });

              totalImported++;
            } catch { /* skip invalid cookies */ }
          }
        } catch (dbErr) {
          errors.push(`${browser.name} (${profile}): ${dbErr.message}`);
        } finally {
          try { fs.unlinkSync(tempPath); } catch {}
        }
      }
    } catch (err) {
      errors.push(`${browser.name}: ${err.message}`);
    }
  }

  if (totalImported === 0 && errors.length > 0) {
    throw new Error('Failed to decrypt cookies. Details: ' + errors.join('; '));
  }
  if (totalImported === 0) {
    throw new Error('No Google accounts signed in (Chrome, Edge, or Brave). Please sign into Google first.');
  }

  return totalImported;
}

ipcMain.handle('import-chrome-cookies', async () => {
  const geminiSession = session.fromPartition('persist:nebula-gemini');
  try {
    const count = await importAllBrowserCookies(geminiSession);
    return { success: true, count };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

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

let pendingPermissions = new Map();
let permissionRequestId = 0;

ipcMain.handle('respond-to-permission', async (event, { id, allowed }) => {
  const callback = pendingPermissions.get(id);
  if (callback) {
    callback(allowed);
    pendingPermissions.delete(id);
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
    if (!config.privacyMode) {
      return callback(true);
    }
    const id = ++permissionRequestId;
    pendingPermissions.set(id, callback);
    const requestingUrl = webContents.getURL();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('request-permission', {
        id,
        url: requestingUrl,
        permission: permission
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
