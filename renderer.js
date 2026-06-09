// State variables
let tabs = [];
let activeTabId = null;
let previousActiveTabId = null;
let bookmarks = [];
let historyList = [];
let isOverlayOpen = false;
let currentOverlayType = null; // 'bookmarks' or 'history'
let isResizing = false;
let currentSidebarMode = null; // 'gemini', 'notes', or null
let agentMode = false;
let neonMode = false;
let privacyMode = false;
let currentPermissionRequest = null;

// DOM elements
const agentPill = document.getElementById('agent-pill');
const agentTabsDots = document.getElementById('agent-tabs-dots');
const agentAddressBar = document.getElementById('agent-address-bar');
const agentQuickSwitch = document.getElementById('agent-quick-switch');
const agentNewTab = document.getElementById('agent-new-tab');
const agentSettings = document.getElementById('agent-settings');
const neonToggle = document.getElementById('neon-toggle');
const agentToggle = document.getElementById('agent-toggle');
const privacyToggle = document.getElementById('privacy-toggle');

const permissionBanner = document.getElementById('permission-banner');
const permissionText = document.getElementById('permission-text');
const permissionAllowBtn = document.getElementById('permission-allow-btn');
const permissionDenyBtn = document.getElementById('permission-deny-btn');

const tbHome = document.getElementById('tb-home');
const tbHistory = document.getElementById('tb-history');
const tbBookmarks = document.getElementById('tb-bookmarks');
const tbGemini = document.getElementById('tb-gemini');
const tbNotes = document.getElementById('tb-notes');

const headerBar = document.getElementById('header-bar');
const tabStrip = document.getElementById('tab-strip');
const tabCenterWrapper = document.getElementById('tab-center-wrapper');
const tabCounterBtn = document.getElementById('tab-counter-btn');
const tabCounterValue = document.getElementById('tab-counter-value');
const collapsedDomainBtn = document.getElementById('collapsed-domain-btn');
const collapsedDomainText = document.getElementById('collapsed-domain-text');

const newTabBtn = document.getElementById('new-tab-btn');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const refreshBtn = document.getElementById('refresh-btn');
const homeBtn = document.getElementById('home-btn');
const addressBar = document.getElementById('address-bar');
const bookmarkBtn = document.getElementById('bookmark-btn');
const starIcon = bookmarkBtn.querySelector('.star-icon');
const webviewContainer = document.getElementById('webview-container');
const newTabDashboard = document.getElementById('new-tab-dashboard');

const bookmarksMenuBtn = document.getElementById('bookmarks-menu-btn');
const historyMenuBtn = document.getElementById('history-menu-btn');
const settingsBtn = document.getElementById('settings-btn');
const headerGeminiSpark = document.getElementById('header-gemini-spark');
const headerNotesBtn = document.getElementById('header-notes-btn');
const sidebarPanel = document.getElementById('sidebar-panel');
const sidebarResizer = document.getElementById('sidebar-resizer');
const statusBarText = document.getElementById('status-text');
const progressBarFill = document.getElementById('progress-bar-fill');

const managerOverlay = document.getElementById('manager-overlay');
const overlayTitle = document.getElementById('overlay-title');
const closeOverlayBtn = document.getElementById('close-overlay-btn');
const overlaySearchInput = document.getElementById('overlay-search-input');
const overlayList = document.getElementById('overlay-list');

// Sidebar Content panels
const aiPanel = document.getElementById('ai-panel');
const notesPanel = document.getElementById('notes-panel');
const notesTextarea = document.getElementById('notes-textarea');
const geminiWebview = document.getElementById('gemini-webview');

// Dashboard Elements
const searchBox = document.getElementById('search-box');
const searchBoxBtn = document.getElementById('search-box-btn');
const speedDialGrid = document.getElementById('speed-dial-grid');
const timeWidget = document.getElementById('time-widget');

// New Tab Spark Widgets
const newtabGeminiSpark = document.getElementById('newtab-gemini-spark');
const geminiSparkLarge = document.getElementById('gemini-spark-large');
const centerSparkContainer = document.getElementById('center-spark-container');

// Settings Options Selectors
const sidebarPosSelect = document.getElementById('sidebar-pos-select');
const sparkBtnSelect = document.getElementById('spark-btn-select');

// Initialize app data on load
async function init() {
  try {
    // Load Bookmarks and History using the secure Electron bridge API
    bookmarks = await window.api.getBookmarks() || [];
    historyList = await window.api.getHistory() || [];
  } catch (err) {
    console.error('Failed to load storage from main process:', err);
    // Fallback to localStorage if API is missing in normal web debugging
    bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    historyList = JSON.parse(localStorage.getItem('history') || '[]');
  }

  // Load config from main process
  try {
    const config = await window.api.getConfig();
    neonMode = config.neonMode || false;
    agentMode = config.agentMode || false;
    privacyMode = config.privacyMode || false;

    // Apply toolbar customizer
    const toolbarConfig = config.toolbarConfig || {
      home: true,
      history: true,
      bookmarks: true,
      gemini: true,
      notes: true
    };
    applyToolbarConfig(toolbarConfig);
    if (tbHome) tbHome.checked = toolbarConfig.home !== false;
    if (tbHistory) tbHistory.checked = toolbarConfig.history !== false;
    if (tbBookmarks) tbBookmarks.checked = toolbarConfig.bookmarks !== false;
    if (tbGemini) tbGemini.checked = toolbarConfig.gemini !== false;
    if (tbNotes) tbNotes.checked = toolbarConfig.notes !== false;
  } catch (err) {
    console.error('Failed to load configuration:', err);
  }

  // Apply Neon Mode classes
  if (neonMode) {
    document.body.classList.add('neon-mode-active');
  }
  if (neonToggle) neonToggle.value = neonMode ? 'true' : 'false';

  if (privacyToggle) privacyToggle.value = privacyMode ? 'true' : 'false';

  // Apply Agent Mode layout
  if (agentMode) {
    document.body.classList.add('agent-mode');
    if (sidebarPanel) sidebarPanel.classList.add('collapsed');
  } else {
    document.body.classList.remove('agent-mode');
  }
  if (agentToggle) agentToggle.value = agentMode ? 'true' : 'false';

  // Load and apply saved theme
  const savedTheme = localStorage.getItem('nebula_theme') || 'deep-space';
  applyTheme(savedTheme);

  // Load and apply layout settings
  const sidebarPos = localStorage.getItem('nebula_sidebar_pos') || 'right';
  applySidebarPosition(sidebarPos);
  if (sidebarPosSelect) sidebarPosSelect.value = sidebarPos;

  const sparkSetting = localStorage.getItem('nebula_spark_setting') || 'right';
  applySparkSetting(sparkSetting);
  if (sparkBtnSelect) sparkBtnSelect.value = sparkSetting;

  // Set up clock widget
  updateClock();
  setInterval(updateClock, 1000);

  // Setup Event Listeners
  setupEventListeners();

  // Create first tab
  if (agentMode) {
    createNewTab('https://gemini.google.com');
  } else {
    createNewTab();
  }
}

// -------------------------------------------------------------
// EVENT LISTENERS CONFIG
// -------------------------------------------------------------
function setupEventListeners() {
  newTabBtn.addEventListener('click', () => createNewTab());

  backBtn.addEventListener('click', () => {
    const activeWebview = getActiveWebview();
    if (activeWebview && activeWebview.canGoBack()) activeWebview.goBack();
  });

  forwardBtn.addEventListener('click', () => {
    const activeWebview = getActiveWebview();
    if (activeWebview && activeWebview.canGoForward()) activeWebview.goForward();
  });

  refreshBtn.addEventListener('click', () => {
    const activeWebview = getActiveWebview();
    if (activeWebview) activeWebview.reload();
  });

  homeBtn.addEventListener('click', () => {
    navigateTo(activeTabId, 'newtab');
  });

  // Navigate on enter in address bar
  addressBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const input = addressBar.value.trim();
      if (input) {
        navigateTo(activeTabId, input);
        addressBar.blur();
      }
    }
  });

  // Highlight input on click
  addressBar.addEventListener('click', () => {
    addressBar.select();
  });

  // Toggle bookmark for active page
  bookmarkBtn.addEventListener('click', toggleCurrentPageBookmark);

  // Gemini toggle button in header
  if (headerGeminiSpark) {
    headerGeminiSpark.addEventListener('click', () => {
      toggleSidebarMode('gemini');
    });
  }

  // Notepad toggle button in header
  if (headerNotesBtn) {
    headerNotesBtn.addEventListener('click', () => {
      toggleSidebarMode('notes');
    });
  }

  // Sidebar resizer drag events
  if (sidebarResizer) {
    sidebarResizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      sidebarResizer.classList.add('resizing');
      sidebarPanel.classList.add('resizing');
      e.preventDefault();
    });
  }

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const sidebarPos = localStorage.getItem('nebula_sidebar_pos') || 'right';
    let newWidth;
    if (sidebarPos === 'right') {
      newWidth = window.innerWidth - e.clientX;
    } else {
      newWidth = e.clientX;
    }

    // Allow any width greater than 10px
    if (newWidth >= 10) {
      sidebarPanel.style.width = newWidth + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      if (sidebarResizer) sidebarResizer.classList.remove('resizing');
      sidebarPanel.classList.remove('resizing');
    }
  });

  // Save notes dynamically
  notesTextarea.value = localStorage.getItem('nebula_notes') || '';
  notesTextarea.addEventListener('input', () => {
    localStorage.setItem('nebula_notes', notesTextarea.value);
  });

  // Overlay events
  bookmarksMenuBtn.addEventListener('click', () => openOverlay('bookmarks'));
  historyMenuBtn.addEventListener('click', () => openOverlay('history'));
  closeOverlayBtn.addEventListener('click', closeOverlay);
  overlaySearchInput.addEventListener('input', renderOverlayList);

  // Settings nav button click
  settingsBtn.addEventListener('click', () => {
    navigateTo(activeTabId, 'nebula://settings');
  });

  // Top header taskbar collapse / expand logic
  tabCounterBtn.addEventListener('click', () => {
    headerBar.className = 'header-bar tab-mode';
  });

  collapsedDomainBtn.addEventListener('click', () => {
    headerBar.className = 'header-bar address-mode';
    setTimeout(() => addressBar.select(), 50); // focus address bar automatically on expand
  });

  // New Tab dashboard search box
  searchBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = searchBox.value.trim();
      if (query) navigateTo(activeTabId, `https://google.com/search?q=${encodeURIComponent(query)}`);
    }
  });
  searchBoxBtn.addEventListener('click', () => {
    const query = searchBox.value.trim();
    if (query) navigateTo(activeTabId, `https://google.com/search?q=${encodeURIComponent(query)}`);
  });

  // Gemini Spark triggers
  if (newtabGeminiSpark) {
    newtabGeminiSpark.addEventListener('click', () => {
      openSidebarToMode('gemini');
    });
  }
  if (geminiSparkLarge) {
    geminiSparkLarge.addEventListener('click', () => {
      openSidebarToMode('gemini');
    });
  }

  // Speed Dial grid event
  document.querySelectorAll('.speed-dial-item:not(.add-shortcut)').forEach(item => {
    item.addEventListener('click', () => {
      const url = item.getAttribute('data-url');
      if (url) navigateTo(activeTabId, url);
    });
  });

  // Add custom speed dial site
  document.getElementById('add-shortcut-btn').addEventListener('click', () => {
    const name = prompt("Enter site name:");
    const url = prompt("Enter site URL (e.g. https://example.com):");
    if (name && url) {
      addSpeedDialItem(name, url);
    }
  });

  // Settings Dashboard sidebar navigation
  document.querySelectorAll('.settings-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.settings-menu-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));

      item.classList.add('active');
      const section = document.getElementById(item.dataset.sec);
      if (section) section.classList.add('active');
    });
  });

  // Theme selection configuration card click events
  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      applyTheme(card.dataset.theme);
    });
  });

  // Layout select change events in settings
  if (sidebarPosSelect) {
    sidebarPosSelect.addEventListener('change', (e) => {
      applySidebarPosition(e.target.value);
    });
  }
  if (sparkBtnSelect) {
    sparkBtnSelect.addEventListener('change', (e) => {
      applySparkSetting(e.target.value);
    });
  }

  if (neonToggle) {
    neonToggle.addEventListener('change', async (e) => {
      const val = e.target.value === 'true';
      neonMode = val;
      if (val) {
        document.body.classList.add('neon-mode-active');
        updateNeonThemeFromWebview(activeTabId);
      } else {
        document.body.classList.remove('neon-mode-active');
        resetAddressBarColor();
      }
      try {
        await window.api.saveConfig({ neonMode, agentMode });
      } catch (err) {
        console.error('Failed to save config:', err);
      }
    });
  }

  if (agentToggle) {
    agentToggle.addEventListener('change', async (e) => {
      const val = e.target.value === 'true';
      agentMode = val;
      try {
        await window.api.saveConfig({ neonMode, agentMode });
        if (confirm('Nebula Agent mode requires a restart to apply. Restart now?')) {
          await window.api.restartApp();
        }
      } catch (err) {
        console.error('Failed to save config:', err);
      }
    });
  }

  if (agentAddressBar) {
    agentAddressBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const input = agentAddressBar.value.trim();
        if (input) {
          navigateTo(activeTabId, input);
          agentAddressBar.blur();
        }
      }
    });
    agentAddressBar.addEventListener('click', () => {
      agentAddressBar.select();
    });
  }

  if (agentQuickSwitch) {
    agentQuickSwitch.addEventListener('click', () => {
      if (previousActiveTabId) {
        activateTab(previousActiveTabId);
      }
    });
  }

  if (agentNewTab) {
    agentNewTab.addEventListener('click', () => {
      createNewTab();
    });
  }

  if (agentSettings) {
    agentSettings.addEventListener('click', () => {
      navigateTo(activeTabId, 'nebula://settings');
    });
  }

  // Search Bookmarks inside settings dashboard
  document.getElementById('settings-bookmarks-search').addEventListener('input', (e) => {
    renderSettingsBookmarks(e.target.value.toLowerCase());
  });

  // Search History inside settings dashboard
  document.getElementById('settings-history-search').addEventListener('input', (e) => {
    renderSettingsHistory(e.target.value.toLowerCase());
  });

  // Clear history button in settings dashboard
  document.getElementById('clear-history-btn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear your browsing history?')) {
      historyList = [];
      if (window.api) await window.api.saveHistory(historyList);
      else localStorage.setItem('history', JSON.stringify(historyList));
      renderSettingsHistory();
    }
  });

  if (privacyToggle) {
    privacyToggle.addEventListener('change', async (e) => {
      privacyMode = e.target.value === 'true';
      try {
        const config = await window.api.getConfig();
        config.privacyMode = privacyMode;
        await window.api.saveConfig(config);
      } catch (err) {
        console.error(err);
      }
    });
  }

  const updateToolbarSettings = async () => {
    const toolbarConfig = {
      home: !!tbHome?.checked,
      history: !!tbHistory?.checked,
      bookmarks: !!tbBookmarks?.checked,
      gemini: !!tbGemini?.checked,
      notes: !!tbNotes?.checked
    };
    applyToolbarConfig(toolbarConfig);
    try {
      const config = await window.api.getConfig();
      config.toolbarConfig = toolbarConfig;
      await window.api.saveConfig(config);
    } catch (err) {
      console.error(err);
    }
  };
  [tbHome, tbHistory, tbBookmarks, tbGemini, tbNotes].forEach(cb => {
    if (cb) cb.addEventListener('change', updateToolbarSettings);
  });

  if (permissionAllowBtn) {
    permissionAllowBtn.addEventListener('click', () => {
      respondToPermission(true);
    });
  }
  if (permissionDenyBtn) {
    permissionDenyBtn.addEventListener('click', () => {
      respondToPermission(false);
    });
  }

  if (window.api && window.api.onRequestPermission) {
    window.api.onRequestPermission(({ id, url, permission }) => {
      currentPermissionRequest = id;
      if (permissionBanner && permissionText) {
        let readableName = permission;
        if (permission === 'media') readableName = 'camera/microphone';
        permissionText.textContent = `"${new URL(url).hostname}" wants access to your ${readableName}`;
        permissionBanner.classList.remove('hidden');
      }
    });
  }
}

// -------------------------------------------------------------
// TAB OPERATIONS
// -------------------------------------------------------------
function createNewTab(url = 'newtab') {
  const tabId = 'tab-' + Date.now() + Math.random().toString(36).substr(2, 5);
  
  // 1. Create Tab DOM
  const tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.id = tabId;
  tabEl.innerHTML = `
    <img class="tab-favicon" src="" style="display: none;">
    <span class="tab-title">New Tab</span>
    <button class="tab-close-btn">&times;</button>
  `;
  
  tabEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-close-btn')) {
      e.stopPropagation();
      closeTab(tabId);
    } else {
      activateTab(tabId);
    }
  });
  
  tabStrip.appendChild(tabEl);

  // 2. Create Webview (if not newtab, or we lazy render)
  let webview = null;
  if (url !== 'newtab') {
    webview = createWebviewElement(tabId, url);
    webviewContainer.appendChild(webview);
    webview.setAttribute('src', cleanUrl(url));
  }

  // 3. Add to state
  tabs.push({
    id: tabId,
    title: url === 'newtab' ? 'New Tab' : (url === 'nebula://settings' ? 'Settings' : 'New Tab'),
    url: url,
    webview: webview,
    canGoBack: false,
    canGoForward: false
  });

  activateTab(tabId);
  updateTabCountDisplay();
  updateAgentTabsPill();
}

function createWebviewElement(tabId, url) {
  const webview = document.createElement('webview');
  webview.id = 'wv-' + tabId;
  webview.setAttribute('allowpopups', 'true');
  
  // Set Safari user agent to avoid webview blockages on websites like YouTube/Google
  webview.setAttribute('useragent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15');

  // Hook webview events
  webview.addEventListener('did-start-loading', () => {
    statusBarText.textContent = 'Loading...';
    progressBarFill.style.width = '30%';
    if (activeTabId === tabId) {
      refreshBtn.querySelector('svg').classList.add('spinning');
    }
  });

  webview.addEventListener('did-stop-loading', () => {
    statusBarText.textContent = 'Ready';
    progressBarFill.style.width = '0%';
    if (activeTabId === tabId) {
      refreshBtn.querySelector('svg').classList.remove('spinning');
      updateNavControls(tabId);
      updateNeonThemeFromWebview(tabId);
    }
    // Save URL history once page loads fully
    saveToHistory(webview.getURL(), webview.getTitle());
  });

  webview.addEventListener('page-title-updated', (e) => {
    const tabObj = tabs.find(t => t.id === tabId);
    if (tabObj) {
      tabObj.title = e.title;
      const tabEl = document.getElementById(tabId);
      if (tabEl) {
        tabEl.querySelector('.tab-title').textContent = e.title;
        tabEl.title = e.title;
      }
      updateAgentTabsPill();
    }
  });

  webview.addEventListener('did-navigate', (e) => {
    const tabObj = tabs.find(t => t.id === tabId);
    if (tabObj) {
      tabObj.url = e.url;
      try {
        const domainUrl = new URL(e.url).hostname;
        const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain=${domainUrl}`;
        tabObj.favicon = iconUrl;
        updateTabFaviconUI(tabId, iconUrl);
      } catch (err) {}
      if (activeTabId === tabId) {
        addressBar.value = e.url;
        if (agentAddressBar) agentAddressBar.value = e.url;
        updateSecurityBadge(e.url);
        updateBookmarkStarState(e.url);
        updateDomainDisplay(e.url);
        updateNeonThemeFromWebview(tabId);
      }
      updateAgentTabsPill();
    }
  });

  webview.addEventListener('did-navigate-in-page', (e) => {
    const tabObj = tabs.find(t => t.id === tabId);
    if (tabObj) {
      tabObj.url = e.url;
      try {
        const domainUrl = new URL(e.url).hostname;
        const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain=${domainUrl}`;
        tabObj.favicon = iconUrl;
        updateTabFaviconUI(tabId, iconUrl);
      } catch (err) {}
      if (activeTabId === tabId) {
        addressBar.value = e.url;
        if (agentAddressBar) agentAddressBar.value = e.url;
        updateSecurityBadge(e.url);
        updateBookmarkStarState(e.url);
        updateDomainDisplay(e.url);
        updateNeonThemeFromWebview(tabId);
      }
      updateAgentTabsPill();
    }
  });

  webview.addEventListener('page-favicon-updated', (e) => {
    const tabObj = tabs.find(t => t.id === tabId);
    if (tabObj && e.favicons && e.favicons.length > 0) {
      tabObj.favicon = e.favicons[0];
      updateTabFaviconUI(tabId, e.favicons[0]);
    }
  });

  return webview;
}

function activateTab(tabId) {
  if (activeTabId && activeTabId !== tabId) {
    previousActiveTabId = activeTabId;
  }
  activeTabId = tabId;
  const tabObj = tabs.find(t => t.id === tabId);
  if (!tabObj) return;

  // Update tabs UI
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const activeTabEl = document.getElementById(tabId);
  if (activeTabEl) activeTabEl.classList.add('active');

  // Show / Hide matching webviews
  document.querySelectorAll('webview').forEach(wv => {
    if (wv.id !== 'gemini-webview') {
      wv.classList.remove('active');
    }
  });
  
  // Hide settings dashboard by default
  const settingsDashboard = document.getElementById('settings-dashboard');
  settingsDashboard.classList.add('hidden');

  if (tabObj.url === 'newtab') {
    // Show newtab dashboard
    newTabDashboard.style.display = 'flex';
    addressBar.value = '';
    if (agentAddressBar) agentAddressBar.value = '';
    updateBookmarkStarState('');
    updateSecurityBadge('newtab');
    updateDomainDisplay('newtab');
  } else if (tabObj.url === 'nebula://settings') {
    newTabDashboard.style.display = 'none';
    settingsDashboard.classList.remove('hidden');
    addressBar.value = 'nebula://settings';
    if (agentAddressBar) agentAddressBar.value = 'nebula://settings';
    updateBookmarkStarState('');
    updateSecurityBadge('newtab');
    updateDomainDisplay('settings');
    renderSettingsBookmarks();
    renderSettingsHistory();
  } else {
    newTabDashboard.style.display = 'none';
    if (tabObj.webview) {
      tabObj.webview.classList.add('active');
    }
    addressBar.value = tabObj.url;
    if (agentAddressBar) agentAddressBar.value = tabObj.url;
    updateBookmarkStarState(tabObj.url);
    updateSecurityBadge(tabObj.url);
    updateDomainDisplay(tabObj.url);
  }

  updateNavControls(tabId);
  updateAgentTabsPill();
  updateNeonThemeFromWebview(tabId);
}

function closeTab(tabId) {
  const tabIndex = tabs.findIndex(t => t.id === tabId);
  if (tabIndex === -1) return;

  const tabObj = tabs[tabIndex];
  
  // Remove tab DOM
  const tabEl = document.getElementById(tabId);
  if (tabEl) tabEl.remove();

  // Remove matching webview
  if (tabObj.webview) tabObj.webview.remove();

  // Remove from state array
  tabs.splice(tabIndex, 1);

  // If we closed the active tab, clear previous active
  if (previousActiveTabId === tabId) {
    previousActiveTabId = null;
  }

  // If no tabs left, close the app or open a new tab
  if (tabs.length === 0) {
    if (agentMode) {
      createNewTab('https://gemini.google.com');
    } else {
      createNewTab();
    }
    return;
  }

  // If we closed the active tab, switch to another tab
  if (activeTabId === tabId) {
    const newActiveIndex = Math.max(0, tabIndex - 1);
    activateTab(tabs[newActiveIndex].id);
  }

  updateTabCountDisplay();
  updateAgentTabsPill();
}

function getActiveWebview() {
  const activeTab = tabs.find(t => t.id === activeTabId);
  return activeTab ? activeTab.webview : null;
}

// -------------------------------------------------------------
// NAVIGATION
// -------------------------------------------------------------
function navigateTo(tabId, url) {
  const tabObj = tabs.find(t => t.id === tabId);
  if (!tabObj) return;

  // Force address mode when initiating manual navigation
  headerBar.className = 'header-bar address-mode';

  if (url === 'newtab' || url === 'nebula://settings') {
    tabObj.url = url;
    tabObj.title = url === 'newtab' ? 'New Tab' : 'Settings';
    
    // Hide active webview if it exists
    if (tabObj.webview) {
      tabObj.webview.remove();
      tabObj.webview = null;
    }

    // Refresh UI
    const tabEl = document.getElementById(tabId);
    if (tabEl) {
      tabEl.querySelector('.tab-title').textContent = url === 'newtab' ? 'New Tab' : 'Settings';
    }

    if (activeTabId === tabId) {
      activateTab(tabId);
    }
  } else {
    const targetUrl = cleanUrl(url);
    tabObj.url = targetUrl;

    if (!tabObj.webview) {
      tabObj.webview = createWebviewElement(tabId, targetUrl);
      webviewContainer.appendChild(tabObj.webview);
      tabObj.webview.setAttribute('src', targetUrl);
    } else {
      tabObj.webview.setAttribute('src', targetUrl);
    }

    if (activeTabId === tabId) {
      activateTab(tabId);
    }
  }
}

function cleanUrl(url) {
  url = url.trim();
  
  // If looks like a direct local command
  if (url === 'newtab' || url.startsWith('chrome://') || url.startsWith('file://')) {
    return url;
  }

  // If matches standard URL format (domain.tld)
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?(\?.*)?(#.*)?$/i;
  
  // If it's a domain name or looks like IP
  if (urlPattern.test(url) || url.startsWith('localhost') || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    return url;
  }
  
  // Otherwise, treat as google search query
  return 'https://www.google.com/search?q=' + encodeURIComponent(url);
}

function updateNavControls(tabId) {
  const tabObj = tabs.find(t => t.id === tabId);
  if (!tabObj || !tabObj.webview) {
    backBtn.disabled = true;
    forwardBtn.disabled = true;
    return;
  }

  try {
    backBtn.disabled = !tabObj.webview.canGoBack();
    forwardBtn.disabled = !tabObj.webview.canGoForward();
  } catch (e) {
    // Webview might not be fully attached/ready
    backBtn.disabled = true;
    forwardBtn.disabled = true;
  }
}

function updateSecurityBadge(url) {
  const badge = document.getElementById('security-badge');
  const lockIcon = document.getElementById('lock-icon');

  if (url.startsWith('https://')) {
    badge.className = 'security-badge secure';
    badge.title = 'Secure Connection (HTTPS)';
    lockIcon.style.display = 'block';
  } else if (url === 'newtab' || url === '') {
    badge.className = 'security-badge';
    badge.title = 'Nebula dashboard';
    lockIcon.style.display = 'none';
  } else {
    badge.className = 'security-badge insecure';
    badge.title = 'Insecure Connection (HTTP/Unverified)';
    lockIcon.style.display = 'block';
  }
}

// -------------------------------------------------------------
// BOOKMARKS AND HISTORY PREFERENCES
// -------------------------------------------------------------
function updateBookmarkStarState(url) {
  const isBookmarked = bookmarks.some(b => b.url === url);
  if (isBookmarked) {
    starIcon.classList.add('active');
  } else {
    starIcon.classList.remove('active');
  }
}

async function toggleCurrentPageBookmark() {
  const tabObj = tabs.find(t => t.id === activeTabId);
  if (!tabObj || tabObj.url === 'newtab') return;

  const url = tabObj.url;
  const title = tabObj.title || url;

  const index = bookmarks.findIndex(b => b.url === url);
  if (index > -1) {
    // Remove bookmark
    bookmarks.splice(index, 1);
    starIcon.classList.remove('active');
  } else {
    // Add bookmark
    bookmarks.push({ url, title, date: Date.now() });
    starIcon.classList.add('active');
  }

  // Save via main process IPC
  if (window.api) {
    await window.api.saveBookmarks(bookmarks);
  } else {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }
}

async function saveToHistory(url, title) {
  if (!url || url === 'about:blank' || url === 'newtab') return;

  // Avoid spamming consecutive duplicates
  if (historyList.length > 0 && historyList[0].url === url) return;

  historyList.unshift({
    url,
    title: title || url,
    date: Date.now()
  });

  // Keep history to 200 items maximum
  if (historyList.length > 200) {
    historyList.pop();
  }

  // Save via IPC
  if (window.api) {
    await window.api.saveHistory(historyList);
  } else {
    localStorage.setItem('history', JSON.stringify(historyList));
  }
}

// -------------------------------------------------------------
// HISTORY / BOOKMARKS OVERLAYS
// -------------------------------------------------------------
function openOverlay(type) {
  isOverlayOpen = true;
  currentOverlayType = type;
  managerOverlay.classList.remove('hidden');
  overlayTitle.textContent = type.charAt(0).toUpperCase() + type.slice(1);
  overlaySearchInput.value = '';
  renderOverlayList();
}

function closeOverlay() {
  isOverlayOpen = false;
  currentOverlayType = null;
  managerOverlay.classList.add('hidden');
}

function renderOverlayList() {
  overlayList.innerHTML = '';
  const searchVal = overlaySearchInput.value.toLowerCase();
  const listSource = currentOverlayType === 'bookmarks' ? bookmarks : historyList;

  const filtered = listSource.filter(item => {
    return item.title.toLowerCase().includes(searchVal) || item.url.toLowerCase().includes(searchVal);
  });

  if (filtered.length === 0) {
    overlayList.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">No entries found</div>`;
    return;
  }

  filtered.forEach((item, index) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'overlay-list-item';
    
    // Create direct content container
    const infoContainer = document.createElement('div');
    infoContainer.className = 'item-info';
    infoContainer.innerHTML = `
      <span class="item-title">${escapeHtml(item.title)}</span>
      <span class="item-url">${escapeHtml(item.url)}</span>
    `;

    // Click to navigate
    infoContainer.addEventListener('click', () => {
      navigateTo(activeTabId, item.url);
      closeOverlay();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-item-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      // Remove from memory
      const listIndex = listSource.findIndex(x => x.url === item.url);
      if (listIndex > -1) {
        listSource.splice(listIndex, 1);
        if (currentOverlayType === 'bookmarks') {
          if (window.api) await window.api.saveBookmarks(bookmarks);
          else localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
          updateBookmarkStarState(tabs.find(t => t.id === activeTabId)?.url || '');
        } else {
          if (window.api) await window.api.saveHistory(historyList);
          else localStorage.setItem('history', JSON.stringify(historyList));
        }
        renderOverlayList();
      }
    });

    itemEl.appendChild(infoContainer);
    itemEl.appendChild(deleteBtn);
    overlayList.appendChild(itemEl);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// -------------------------------------------------------------
// GENERAL UTILS / CLOCK / WIDGETS
// -------------------------------------------------------------
function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // hour '0' is '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  timeWidget.textContent = `${hours}:${minutes} ${ampm}`;
}

function addSpeedDialItem(name, url) {
  const grid = document.getElementById('speed-dial-grid');
  const addBtn = document.getElementById('add-shortcut-btn');

  const item = document.createElement('div');
  item.className = 'speed-dial-item';
  item.setAttribute('data-url', url);

  const initial = name.charAt(0).toUpperCase();
  item.innerHTML = `
    <div class="icon-wrapper" style="background: var(--accent-gradient)">${initial}</div>
    <span>${name}</span>
  `;

  item.addEventListener('click', () => navigateTo(activeTabId, url));
  grid.insertBefore(item, addBtn);
}

// -------------------------------------------------------------
// LAYOUT & SETTINGS INTERACTION METHODS
// -------------------------------------------------------------
function updateTabCountDisplay() {
  if (tabCounterValue) {
    tabCounterValue.textContent = tabs.length;
  }
}

function updateDomainDisplay(url) {
  if (!collapsedDomainText) return;
  
  if (url === 'newtab') {
    collapsedDomainText.textContent = 'newtab';
    return;
  }
  if (url === 'nebula://settings') {
    collapsedDomainText.textContent = 'settings';
    return;
  }

  try {
    const domain = new URL(url).hostname;
    collapsedDomainText.textContent = domain.startsWith('www.') ? domain.slice(4) : domain;
  } catch (e) {
    collapsedDomainText.textContent = url;
  }
}

// Toggles sidebar Mode dynamically and splits Gemini / Notepad
function toggleSidebarMode(mode) {
  const isCurrentlyCollapsed = sidebarPanel.classList.contains('collapsed');

  if (isCurrentlyCollapsed) {
    // If closed, open it in the selected mode
    openSidebarToMode(mode);
  } else {
    // If open
    if (currentSidebarMode === mode) {
      // If same mode button clicked, close the sidebar
      sidebarPanel.classList.add('collapsed');
      currentSidebarMode = null;
      if (headerGeminiSpark) headerGeminiSpark.classList.remove('active');
      if (headerNotesBtn) headerNotesBtn.classList.remove('active');
    } else {
      // Switch mode without closing
      openSidebarToMode(mode);
    }
  }
}

function openSidebarToMode(mode) {
  sidebarPanel.classList.remove('collapsed');
  currentSidebarMode = mode;
  
  if (mode === 'gemini') {
    if (headerGeminiSpark) headerGeminiSpark.classList.add('active');
    if (headerNotesBtn) headerNotesBtn.classList.remove('active');
    
    // Switch panels
    aiPanel.classList.add('active');
    notesPanel.classList.remove('active');

    if (geminiWebview && !geminiWebview.src) {
      geminiWebview.src = 'https://gemini.google.com';
      geminiWebview.addEventListener('dom-ready', () => {
        geminiWebview.setZoomFactor(0.8);
      });
    }
  } else {
    if (headerNotesBtn) headerNotesBtn.classList.add('active');
    if (headerGeminiSpark) headerGeminiSpark.classList.remove('active');

    // Switch panels
    notesPanel.classList.add('active');
    aiPanel.classList.remove('active');
  }
}

// Apply themes dynamically
function applyTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('nebula_theme', themeName);

  document.querySelectorAll('.theme-card').forEach(card => {
    if (card.dataset.theme === themeName) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

// Shifting the sidebar left/right alignment
function applySidebarPosition(position) {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  if (position === 'left') {
    mainContent.classList.add('sidebar-left');
  } else {
    mainContent.classList.remove('sidebar-left');
  }
  localStorage.setItem('nebula_sidebar_pos', position);
}

// Configure Gemini Spark Widget display settings
function applySparkSetting(setting) {
  const newtabSpark = document.getElementById('newtab-gemini-spark');
  const centerSpark = document.getElementById('center-spark-container');

  if (setting === 'hidden') {
    if (newtabSpark) newtabSpark.style.display = 'none';
    if (centerSpark) centerSpark.classList.add('hidden');
  } else if (setting === 'center') {
    if (newtabSpark) newtabSpark.style.display = 'none';
    if (centerSpark) centerSpark.classList.remove('hidden');
  } else { // default 'right'
    if (newtabSpark) newtabSpark.style.display = 'flex';
    if (centerSpark) centerSpark.classList.add('hidden');
  }
  localStorage.setItem('nebula_spark_setting', setting);
}

// Render Bookmarks panel inside the settings tab
function renderSettingsBookmarks(filter = '') {
  const listEl = document.getElementById('settings-bookmarks-list');
  if (!listEl) return;

  listEl.innerHTML = '';
  const filtered = bookmarks.filter(b => b.title.toLowerCase().includes(filter) || b.url.toLowerCase().includes(filter));

  if (filtered.length === 0) {
    listEl.innerHTML = '<div style="padding: 20px; color: var(--text-muted); font-size: 14px;">No bookmarks found.</div>';
    return;
  }

  filtered.forEach(item => {
    const row = document.createElement('div');
    row.className = 'settings-list-item';
    
    const info = document.createElement('div');
    info.className = 'item-info';
    info.innerHTML = `
      <strong class="item-title">${escapeHtml(item.title)}</strong>
      <span class="item-url">${escapeHtml(item.url)}</span>
    `;

    info.addEventListener('click', () => {
      navigateTo(activeTabId, item.url);
    });

    const del = document.createElement('button');
    del.className = 'delete-item-btn';
    del.innerHTML = '&times;';
    del.style.fontSize = '20px';
    del.addEventListener('click', async (e) => {
      e.stopPropagation();
      const idx = bookmarks.findIndex(x => x.url === item.url);
      if (idx > -1) {
        bookmarks.splice(idx, 1);
        if (window.api) await window.api.saveBookmarks(bookmarks);
        else localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        renderSettingsBookmarks(filter);
        updateBookmarkStarState(tabs.find(t => t.id === activeTabId)?.url || '');
      }
    });

    row.appendChild(info);
    row.appendChild(del);
    listEl.appendChild(row);
  });
}

// Render History panel inside settings tab
function renderSettingsHistory(filter = '') {
  const listEl = document.getElementById('settings-history-list');
  if (!listEl) return;

  listEl.innerHTML = '';
  const filtered = historyList.filter(h => h.title.toLowerCase().includes(filter) || h.url.toLowerCase().includes(filter));

  if (filtered.length === 0) {
    listEl.innerHTML = '<div style="padding: 20px; color: var(--text-muted); font-size: 14px;">No browsing history found.</div>';
    return;
  }

  filtered.forEach(item => {
    const row = document.createElement('div');
    row.className = 'settings-list-item';

    const info = document.createElement('div');
    info.className = 'item-info';
    info.innerHTML = `
      <strong class="item-title">${escapeHtml(item.title)}</strong>
      <span class="item-url">${escapeHtml(item.url)}</span>
    `;

    info.addEventListener('click', () => {
      navigateTo(activeTabId, item.url);
    });

    const del = document.createElement('button');
    del.className = 'delete-item-btn';
    del.innerHTML = '&times;';
    del.style.fontSize = '20px';
    del.addEventListener('click', async (e) => {
      e.stopPropagation();
      const idx = historyList.findIndex(x => x.date === item.date);
      if (idx > -1) {
        historyList.splice(idx, 1);
        if (window.api) await window.api.saveHistory(historyList);
        else localStorage.setItem('history', JSON.stringify(historyList));
        renderSettingsHistory(filter);
      }
    });

    row.appendChild(info);
    row.appendChild(del);
    listEl.appendChild(row);
  });
}

// Render circular indicators in the Agent Mode floating pill
function updateAgentTabsPill() {
  if (!agentTabsDots) return;
  agentTabsDots.innerHTML = '';
  
  if (!agentMode) return;

  tabs.forEach(tab => {
    const dot = document.createElement('div');
    dot.className = 'agent-tab-dot';
    if (tab.id === activeTabId) {
      dot.classList.add('active');
    }
    
    if (tab.favicon) {
      dot.style.backgroundImage = `url("${tab.favicon}")`;
    } else {
      dot.style.backgroundImage = 'none';
    }
    
    dot.setAttribute('data-title', tab.title || 'New Tab');
    
    dot.addEventListener('click', () => {
      activateTab(tab.id);
    });

    dot.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });

    agentTabsDots.appendChild(dot);
  });
}

function updateTabFaviconUI(tabId, iconUrl) {
  const tabEl = document.getElementById(tabId);
  if (tabEl) {
    const img = tabEl.querySelector('.tab-favicon');
    if (img) {
      img.src = iconUrl;
      img.style.display = 'inline-block';
    }
  }
  updateAgentTabsPill();
}

function parseToRgb(color) {
  if (!color) return null;
  const temp = document.createElement('div');
  temp.style.color = color;
  document.body.appendChild(temp);
  const comp = window.getComputedStyle(temp).color;
  document.body.removeChild(temp);
  const match = comp.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (match) {
    return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
  }
  const rgbaMatch = comp.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  if (rgbaMatch) {
    return { r: parseInt(rgbaMatch[1]), g: parseInt(rgbaMatch[2]), b: parseInt(rgbaMatch[3]) };
  }
  return null;
}

function applyNeonColorToChrome(color) {
  const rgb = parseToRgb(color);
  if (!rgb) return;
  const { r, g, b } = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textColor = luminance > 0.5 ? '#121214' : '#f0f3f9';
  const mutedColor = luminance > 0.5 ? 'rgba(18, 18, 20, 0.6)' : 'rgba(240, 243, 249, 0.6)';
  const borderColor = luminance > 0.5 ? 'rgba(18, 18, 20, 0.15)' : 'rgba(255, 255, 255, 0.15)';
  const borderFocus = luminance > 0.5 ? 'rgba(18, 18, 20, 0.4)' : 'rgba(255, 255, 255, 0.4)';

  document.documentElement.style.setProperty('--bg-tab-bar', color);
  document.documentElement.style.setProperty('--bg-panel', color);
  document.documentElement.style.setProperty('--text-main', textColor);
  document.documentElement.style.setProperty('--text-muted', mutedColor);
  document.documentElement.style.setProperty('--border-color', borderColor);
  document.documentElement.style.setProperty('--border-focus', borderFocus);
}

function resetAddressBarColor() {
  document.documentElement.style.removeProperty('--bg-tab-bar');
  document.documentElement.style.removeProperty('--bg-panel');
  document.documentElement.style.removeProperty('--text-main');
  document.documentElement.style.removeProperty('--text-muted');
  document.documentElement.style.removeProperty('--border-color');
  document.documentElement.style.removeProperty('--border-focus');
}

async function updateNeonThemeFromWebview(tabId) {
  if (!neonMode) {
    resetAddressBarColor();
    return;
  }
  const tabObj = tabs.find(t => t.id === tabId);
  if (!tabObj || !tabObj.webview || tabObj.url === 'newtab' || tabObj.url === 'nebula://settings') {
    resetAddressBarColor();
    return;
  }

  try {
    const color = await tabObj.webview.executeJavaScript(`
      (() => {
        // 1. Theme-color meta tag
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta && meta.content) return meta.content;
        
        // 2. Computed background color of body
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') return bodyBg;
        
        return null;
      })()
    `);
    
    if (color) {
      applyNeonColorToChrome(color);
    } else {
      resetAddressBarColor();
    }
  } catch (err) {
    console.error('Failed to retrieve website color:', err);
    resetAddressBarColor();
  }
}

function applyToolbarConfig(toolbarConfig) {
  if (!headerBar) return;
  if (toolbarConfig.home === false) headerBar.classList.add('hide-home');
  else headerBar.classList.remove('hide-home');

  if (toolbarConfig.history === false) headerBar.classList.add('hide-history');
  else headerBar.classList.remove('hide-history');

  if (toolbarConfig.bookmarks === false) headerBar.classList.add('hide-bookmarks');
  else headerBar.classList.remove('hide-bookmarks');

  if (toolbarConfig.gemini === false) headerBar.classList.add('hide-gemini');
  else headerBar.classList.remove('hide-gemini');

  if (toolbarConfig.notes === false) headerBar.classList.add('hide-notes');
  else headerBar.classList.remove('hide-notes');
}

async function respondToPermission(allowed) {
  if (currentPermissionRequest) {
    if (permissionBanner) permissionBanner.classList.add('hidden');
    if (window.api) {
      await window.api.respondToPermission(currentPermissionRequest, allowed);
    }
    currentPermissionRequest = null;
  }
}

// Start browser app
window.addEventListener('DOMContentLoaded', init);
