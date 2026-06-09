// Gemini webview preload - spoofs Chrome browser environment
// Runs before page scripts so Google sign-in doesn't detect Electron

'use strict';

// Patch navigator.userAgent at the JS level
const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

Object.defineProperty(navigator, 'userAgent', {
  get: () => chromeUA,
  configurable: false
});

Object.defineProperty(navigator, 'appVersion', {
  get: () => '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  configurable: false
});

Object.defineProperty(navigator, 'vendor', {
  get: () => 'Google Inc.',
  configurable: false
});

// Inject a minimal window.chrome object (Chrome-specific API Google checks for)
if (!window.chrome) {
  window.chrome = {
    app: {
      isInstalled: false,
      InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
      RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
    },
    runtime: {
      OnInstalledReason: {},
      OnRestartRequiredReason: {},
      PlatformArch: {},
      PlatformNaclArch: {},
      PlatformOs: {},
      RequestUpdateCheckStatus: {}
    },
    csi: () => {},
    loadTimes: () => {}
  };
}

// Remove Electron / Node.js globals that Google can detect
delete window.require;

// Prevent webdriver detection (Electron sets this)
Object.defineProperty(navigator, 'webdriver', {
  get: () => false,
  configurable: false
});
