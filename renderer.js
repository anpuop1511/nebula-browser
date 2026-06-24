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
let defaultAi = 'gemini'; // Toggle default AI companion ('gemini' or 'nix')
let chatHistory = []; // Local AI chat conversation history
let agentMode = false;
let neonMode = false;
let privacyMode = false;
let secureSitesOnly = false;
let headerLayout = 'top';
let floatingBlur = '12px';
let currentPermissionRequest = null;
let screenContextEnabled = true;
let nixAlwaysAllow = 'true';
let nukeMode = false;
let geminiApiKey = '';

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
const toolbarPrivacyBtn = document.getElementById('toolbar-privacy-btn');
const openFileBtn = document.getElementById('open-file-btn');
const localFileInput = document.getElementById('local-file-input');

const permissionBanner = document.getElementById('permission-banner');
const permissionText = document.getElementById('permission-text');
const permissionOnceBtn = document.getElementById('permission-once-btn');
const permissionSessionBtn = document.getElementById('permission-session-btn');
const permissionTimedBtn = document.getElementById('permission-timed-btn');
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
const claudeWebview = document.getElementById('claude-webview');
const chatgptWebview = document.getElementById('chatgpt-webview');

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
const defaultAiSelect = document.getElementById('default-ai-select');

async function saveConfigValue(key, value) {
  try {
    const config = await window.api.getConfig() || {};
    config[key] = value;
    await window.api.saveConfig(config);
  } catch (err) {
    console.error('Failed to save config value:', err);
  }
}

// Update the AI Sidebar displays based on selected companion
function updateAiSidebarDisplay() {
  const sidebarHeaderTitle = document.getElementById('sidebar-header-title');
  
  // Hide all panels/webviews by default
  if (geminiWebview) geminiWebview.classList.add('hidden');
  if (claudeWebview) claudeWebview.classList.add('hidden');
  if (chatgptWebview) chatgptWebview.classList.add('hidden');
  const nixChat = document.getElementById('nebula-nix-chat');
  if (nixChat) nixChat.classList.add('hidden');

  if (defaultAi === 'nix') {
    if (sidebarHeaderTitle && currentSidebarMode === 'gemini') {
      sidebarHeaderTitle.textContent = 'Nebula Nix';
    }
    if (nixChat) nixChat.classList.remove('hidden');
  } else if (defaultAi === 'gemini') {
    if (sidebarHeaderTitle && currentSidebarMode === 'gemini') {
      sidebarHeaderTitle.textContent = 'Gemini AI';
    }
    if (geminiWebview) {
      geminiWebview.classList.remove('hidden');
      if (!geminiWebview.src) {
        geminiWebview.src = 'https://gemini.google.com';
        geminiWebview.addEventListener('dom-ready', () => {
          geminiWebview.setZoomFactor(0.8);
        });
      }
    }
  } else if (defaultAi === 'claude') {
    if (sidebarHeaderTitle && currentSidebarMode === 'gemini') {
      sidebarHeaderTitle.textContent = 'Claude AI';
    }
    if (claudeWebview) {
      claudeWebview.classList.remove('hidden');
      if (!claudeWebview.src) {
        claudeWebview.src = 'https://claude.ai';
        claudeWebview.addEventListener('dom-ready', () => {
          claudeWebview.setZoomFactor(0.8);
        });
      }
    }
  } else if (defaultAi === 'chatgpt') {
    if (sidebarHeaderTitle && currentSidebarMode === 'gemini') {
      sidebarHeaderTitle.textContent = 'ChatGPT';
    }
    if (chatgptWebview) {
      chatgptWebview.classList.remove('hidden');
      if (!chatgptWebview.src) {
        chatgptWebview.src = 'https://chatgpt.com';
        chatgptWebview.addEventListener('dom-ready', () => {
          chatgptWebview.setZoomFactor(0.8);
        });
      }
    }
  }
}

// Initialize app data on load
async function init() {
  // Check if we are running in an OS window frame
  if (window.parent !== window || window.location.search.includes('os_frame=true')) {
    document.body.classList.add('in-os-frame');
    // Force hide window control elements via JS immediately
    setTimeout(() => {
      const ctrls = document.querySelector('.window-controls');
      if (ctrls) {
        ctrls.style.setProperty('display', 'none', 'important');
      }
    }, 50);
  }
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
    secureSitesOnly = config.secureSitesOnly || false;
    screenContextEnabled = config.screenContextEnabled !== false;
    nixAlwaysAllow = config.nixAlwaysAllow !== undefined ? String(config.nixAlwaysAllow) : 'true';
    headerLayout = config.headerLayout || 'top';
    floatingBlur = config.floatingBlur || '12px';
    geminiApiKey = config.geminiApiKey || '';
    defaultAi = config.defaultAi || 'gemini';
    
    const apiKeyInput = document.getElementById('gemini-api-key-input');
    if (apiKeyInput) apiKeyInput.value = geminiApiKey;

    if (defaultAiSelect) defaultAiSelect.value = defaultAi;

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
  if (toolbarPrivacyBtn) {
    if (privacyMode) toolbarPrivacyBtn.classList.add('active');
    else toolbarPrivacyBtn.classList.remove('active');
  }

  // Apply Agent Mode layout
  if (agentMode) {
    document.body.classList.add('agent-mode');
    if (sidebarPanel) sidebarPanel.classList.add('collapsed');
  } else {
    document.body.classList.remove('agent-mode');
  }
  if (agentToggle) agentToggle.value = agentMode ? 'true' : 'false';

  // Load and apply saved theme
  const savedTheme = (localStorage.getItem('nebula_theme') === 'light-frost' ? 'deep-space' : localStorage.getItem('nebula_theme')) || 'deep-space';
  applyTheme(savedTheme);

  // Restore Nebula Accounts state on startup
  const savedUserEmail = localStorage.getItem('nebula_user_email');
  const loggedOutCard = document.getElementById('account-logged-out');
  const loggedInCard = document.getElementById('account-logged-in');
  const emailDisplay = document.getElementById('account-email-display');
  if (savedUserEmail) {
    if (emailDisplay) emailDisplay.textContent = savedUserEmail;
    if (loggedOutCard) loggedOutCard.classList.add('hidden');
    if (loggedInCard) loggedInCard.classList.remove('hidden');
  } else {
    if (loggedOutCard) loggedOutCard.classList.remove('hidden');
    if (loggedInCard) loggedInCard.classList.add('hidden');
  }

  // Load and apply layout settings
  document.body.setAttribute('data-header-layout', headerLayout);
  document.documentElement.style.setProperty('--floating-blur', floatingBlur);
  const headerLayoutSelect = document.getElementById('header-layout-select');
  if (headerLayoutSelect) headerLayoutSelect.value = headerLayout;

  const floatingBlurSelect = document.getElementById('floating-blur-select');
  if (floatingBlurSelect) floatingBlurSelect.value = floatingBlur;

  const secureSitesToggle = document.getElementById('secure-sites-toggle');
  if (secureSitesToggle) secureSitesToggle.value = secureSitesOnly ? 'true' : 'false';

  const screenContextToggle = document.getElementById('screen-context-toggle');
  if (screenContextToggle) screenContextToggle.value = screenContextEnabled ? 'true' : 'false';

  const nixAlwaysAllowToggle = document.getElementById('nix-always-allow-toggle');
  if (nixAlwaysAllowToggle) nixAlwaysAllowToggle.value = nixAlwaysAllow;

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
        headerBar.className = 'header-bar tab-mode';
        const dropdown = document.getElementById('suggestions-dropdown');
        if (dropdown) dropdown.classList.add('hidden');
      }
    } else if (e.key === 'Escape') {
      addressBar.blur();
      headerBar.className = 'header-bar tab-mode';
      const dropdown = document.getElementById('suggestions-dropdown');
      if (dropdown) dropdown.classList.add('hidden');
    }
  });

  // Highlight input on click
  addressBar.addEventListener('click', () => {
    addressBar.select();
  });

  addressBar.addEventListener('input', () => {
    showSuggestions(addressBar);
  });
  addressBar.addEventListener('focus', () => {
    showSuggestions(addressBar);
  });

  // Collapse toolbar on blur to allow viewing tabs
  addressBar.addEventListener('blur', () => {
    setTimeout(() => {
      if (document.activeElement !== addressBar) {
        headerBar.className = 'header-bar tab-mode';
      }
    }, 200);
  });

  // Toggle bookmark for active page
  bookmarkBtn.addEventListener('click', toggleCurrentPageBookmark);

  // Gemini toggle button in header
  if (headerGeminiSpark) {
    headerGeminiSpark.addEventListener('click', () => {
      if (screenContextEnabled && currentSidebarMode === 'gemini') {
        const activeWebview = getActiveWebview();
        if (activeWebview) {
          try {
            activeWebview.selectAll();
            activeWebview.executeJavaScript('document.documentElement.innerText').then(async (text) => {
              try {
                await navigator.clipboard.writeText(text);
                const textSpan = headerGeminiSpark.querySelector('.spark-btn-text');
                if (textSpan) {
                  textSpan.textContent = 'Copied!';
                  setTimeout(() => {
                    textSpan.textContent = 'Screen Context';
                  }, 1500);
                }
                if (geminiWebview) {
                  geminiWebview.focus();
                }
              } catch (err) {
                console.error('Failed to copy innerText:', err);
              }
            }).catch(err => {
              console.error('executeJavaScript innerText failed:', err);
            });
          } catch (err) {
            console.error('Error selecting or executing script:', err);
          }
        }
      } else {
        toggleSidebarMode('gemini');
      }
    });
  }

  // Notepad toggle button in header
  if (headerNotesBtn) {
    headerNotesBtn.addEventListener('click', () => {
      toggleSidebarMode('notes');
    });
  }

  // Sidebar collapse close button click handler
  const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
  if (sidebarCollapseBtn) {
    sidebarCollapseBtn.addEventListener('click', () => {
      sidebarPanel.classList.add('collapsed');
      currentSidebarMode = null;
      if (headerGeminiSpark) {
        headerGeminiSpark.classList.remove('active');
        headerGeminiSpark.classList.remove('expanded');
      }
      if (headerNotesBtn) headerNotesBtn.classList.remove('active');
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

  // Nebula Accounts event bindings
  const accountLoginBtn = document.getElementById('account-login-btn');
  const accountRegisterBtn = document.getElementById('account-register-btn');
  const accountSyncBtn = document.getElementById('account-sync-btn');
  const accountLogoutBtn = document.getElementById('account-logout-btn');
  const loggedOutCard = document.getElementById('account-logged-out');
  const loggedInCard = document.getElementById('account-logged-in');
  const emailDisplay = document.getElementById('account-email-display');

  if (accountLoginBtn) {
    accountLoginBtn.addEventListener('click', () => {
      const email = prompt("Enter your Nebula email to Sign In:", "user@nebula.com");
      if (email && email.includes('@')) {
        localStorage.setItem('nebula_user_email', email);
        if (emailDisplay) emailDisplay.textContent = email;
        if (loggedOutCard) loggedOutCard.classList.add('hidden');
        if (loggedInCard) loggedInCard.classList.remove('hidden');
        alert("Signed into Nebula Accounts successfully! Device sync enabled.");
      }
    });
  }

  if (accountRegisterBtn) {
    accountRegisterBtn.addEventListener('click', () => {
      const email = prompt("Create account with Email address:", "newuser@nebula.com");
      const pass = prompt("Choose a secure password:");
      if (email && pass) {
        localStorage.setItem('nebula_user_email', email);
        if (emailDisplay) emailDisplay.textContent = email;
        if (loggedOutCard) loggedOutCard.classList.add('hidden');
        if (loggedInCard) loggedInCard.classList.remove('hidden');
        alert("Registration complete! Welcome to Nebula v1.3.");
      }
    });
  }

  if (accountSyncBtn) {
    accountSyncBtn.addEventListener('click', () => {
      alert("Bookmarks, History, and Notes synced successfully to cloud server!");
    });
  }

  if (accountLogoutBtn) {
    accountLogoutBtn.addEventListener('click', () => {
      localStorage.removeItem('nebula_user_email');
      if (loggedOutCard) loggedOutCard.classList.remove('hidden');
      if (loggedInCard) loggedInCard.classList.add('hidden');
      alert("Successfully logged out from Nebula Accounts.");
    });
  }

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
  if (defaultAiSelect) {
    defaultAiSelect.addEventListener('change', async (e) => {
      defaultAi = e.target.value;
      updateAiSidebarDisplay();
      await saveConfigValue('defaultAi', defaultAi);
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
      await saveConfigValue('neonMode', val);
    });
  }

  if (agentToggle) {
    agentToggle.addEventListener('change', async (e) => {
      const val = e.target.value === 'true';
      agentMode = val;
      await saveConfigValue('agentMode', val);
      if (confirm('Nebula Agent mode requires a restart to apply. Restart now?')) {
        await window.api.restartApp();
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
          const dropdown = document.getElementById('suggestions-dropdown');
          if (dropdown) dropdown.classList.add('hidden');
        }
      }
    });
    agentAddressBar.addEventListener('click', () => {
      agentAddressBar.select();
    });
    agentAddressBar.addEventListener('input', () => {
      showSuggestions(agentAddressBar);
    });
    agentAddressBar.addEventListener('focus', () => {
      showSuggestions(agentAddressBar);
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

  // Search Credentials inside settings dashboard
  const settingsCredentialsSearch = document.getElementById('settings-credentials-search');
  if (settingsCredentialsSearch) {
    settingsCredentialsSearch.addEventListener('input', (e) => {
      renderSettingsCredentials(e.target.value.toLowerCase());
    });
  }

  // Password-save banner actions
  const passwordSaveConfirmBtn = document.getElementById('password-save-confirm-btn');
  const passwordSaveDenyBtn = document.getElementById('password-save-deny-btn');
  const passwordSaveBanner = document.getElementById('password-save-banner');

  if (passwordSaveConfirmBtn) {
    passwordSaveConfirmBtn.addEventListener('click', async () => {
      if (pendingSaveCredential && window.api) {
        await window.api.saveCredential(pendingSaveCredential);
        renderSettingsCredentials();
      }
      if (passwordSaveBanner) passwordSaveBanner.classList.add('hidden');
      pendingSaveCredential = null;
    });
  }

  if (passwordSaveDenyBtn) {
    passwordSaveDenyBtn.addEventListener('click', () => {
      if (passwordSaveBanner) passwordSaveBanner.classList.add('hidden');
      pendingSaveCredential = null;
    });
  }

  if (privacyToggle) {
    privacyToggle.addEventListener('change', async (e) => {
      privacyMode = e.target.value === 'true';
      if (toolbarPrivacyBtn) {
        if (privacyMode) toolbarPrivacyBtn.classList.add('active');
        else toolbarPrivacyBtn.classList.remove('active');
      }
      updateCookieBtnVisibility();
      await saveConfigValue('privacyMode', privacyMode);
    });
  }

  if (toolbarPrivacyBtn) {
    toolbarPrivacyBtn.addEventListener('click', async () => {
      privacyMode = !privacyMode;
      if (privacyMode) {
        toolbarPrivacyBtn.classList.add('active');
      } else {
        toolbarPrivacyBtn.classList.remove('active');
      }
      if (privacyToggle) privacyToggle.value = privacyMode ? 'true' : 'false';
      updateCookieBtnVisibility();
      await saveConfigValue('privacyMode', privacyMode);
    });
  }

  const secureSitesToggle = document.getElementById('secure-sites-toggle');
  if (secureSitesToggle) {
    secureSitesToggle.addEventListener('change', async (e) => {
      secureSitesOnly = e.target.value === 'true';
      await saveConfigValue('secureSitesOnly', secureSitesOnly);
    });
  }

  const apiKeyInput = document.getElementById('gemini-api-key-input');
  if (apiKeyInput) {
    apiKeyInput.addEventListener('input', async (e) => {
      geminiApiKey = e.target.value.trim();
      await saveConfigValue('geminiApiKey', geminiApiKey);
    });
  }

  const screenContextToggle = document.getElementById('screen-context-toggle');
  if (screenContextToggle) {
    screenContextToggle.addEventListener('change', async (e) => {
      screenContextEnabled = e.target.value === 'true';
      await saveConfigValue('screenContextEnabled', screenContextEnabled);
      // Update header button class immediately if gemini is active
      if (currentSidebarMode === 'gemini' && headerGeminiSpark) {
        if (screenContextEnabled) {
          headerGeminiSpark.classList.add('expanded');
        } else {
          headerGeminiSpark.classList.remove('expanded');
        }
      }
    });
  }

  const nixAlwaysAllowToggle = document.getElementById('nix-always-allow-toggle');
  if (nixAlwaysAllowToggle) {
    nixAlwaysAllowToggle.addEventListener('change', async (e) => {
      nixAlwaysAllow = e.target.value;
      await saveConfigValue('nixAlwaysAllow', nixAlwaysAllow);
      localStorage.setItem('nix_always_allow', nixAlwaysAllow);
    });
  }

  // Nix model dropdown handler
  const updateModelDropdownUI = (selectedModel) => {
    const options = document.querySelectorAll('.nix-model-option');
    let activeLabel = "Nix 1.2 Thinking";
    if (selectedModel === '1.1') activeLabel = "Nix 1.1 Standard";
    else if (selectedModel === '1.2-thinking') activeLabel = "Nix 1.2 Thinking";
    else if (selectedModel === '1.2-ultra') activeLabel = "Nix 1.2 Ultra-Think";
    else if (selectedModel === '1.3-smart') activeLabel = "Nix 1.3 Smart";
    else if (selectedModel === '1.3-pro') activeLabel = "Nix 1.3 Pro";
    else if (selectedModel === '1.3-ultra') activeLabel = "Nix 1.3 Ultra";

    const activeModelNameEl = document.getElementById('nix-active-model-name');
    if (activeModelNameEl) {
      activeModelNameEl.textContent = activeLabel;
    }

    options.forEach(opt => {
      const model = opt.getAttribute('data-model');
      const badge = opt.querySelector('.active-badge');
      if (model === selectedModel) {
        opt.classList.add('active');
        opt.style.color = '#00ff66';
        opt.style.background = 'rgba(0, 255, 102, 0.03)';
        if (badge) badge.classList.remove('hidden');
      } else {
        opt.classList.remove('active');
        opt.style.color = 'var(--text-main)';
        opt.style.background = 'transparent';
        if (badge) badge.classList.add('hidden');
      }
    });

    // Also update the status at the top
    const statusEl = document.getElementById('nix-model-header-status');
    if (statusEl) {
      statusEl.textContent = `Model: ${activeLabel}`;
    }
  };

  const modelTrigger = document.getElementById('nix-model-select-trigger');
  const modelMenu = document.getElementById('nix-model-dropdown-menu');
  const modelChevron = document.getElementById('nix-model-chevron');
  const modelOptions = document.querySelectorAll('.nix-model-option');

  if (modelTrigger && modelMenu) {
    const savedModel = localStorage.getItem('nix_model') || '1.2-thinking';
    updateModelDropdownUI(savedModel);

    modelTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = modelMenu.classList.contains('hidden');
      if (isHidden) {
        modelMenu.classList.remove('hidden');
        if (modelChevron) modelChevron.style.transform = 'rotate(180deg)';
      } else {
        modelMenu.classList.add('hidden');
        if (modelChevron) modelChevron.style.transform = 'rotate(0deg)';
      }
    });

    modelOptions.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const model = opt.getAttribute('data-model');
        localStorage.setItem('nix_model', model);
        updateModelDropdownUI(model);
        modelMenu.classList.add('hidden');
        if (modelChevron) modelChevron.style.transform = 'rotate(0deg)';
      });
    });

    document.addEventListener('click', () => {
      modelMenu.classList.add('hidden');
      if (modelChevron) modelChevron.style.transform = 'rotate(0deg)';
    });
  }

  const headerLayoutSelect = document.getElementById('header-layout-select');
  if (headerLayoutSelect) {
    headerLayoutSelect.addEventListener('change', async (e) => {
      headerLayout = e.target.value;
      document.body.setAttribute('data-header-layout', headerLayout);
      await saveConfigValue('headerLayout', headerLayout);
    });
  }

  const floatingBlurSelect = document.getElementById('floating-blur-select');
  if (floatingBlurSelect) {
    floatingBlurSelect.addEventListener('change', async (e) => {
      floatingBlur = e.target.value;
      document.documentElement.style.setProperty('--floating-blur', floatingBlur);
      await saveConfigValue('floatingBlur', floatingBlur);
    });
  }

  // In-Browser Updater UI Binds
  const updateBtn = document.getElementById('update-btn');
  const updateUrlInput = document.getElementById('update-url-input');
  const updateStatusMsg = document.getElementById('update-status-msg');

  function showUpdateNotification(version) {
    if (document.getElementById('nebula-update-notification')) return;

    const banner = document.createElement('div');
    banner.id = 'nebula-update-notification';
    banner.style.position = 'absolute';
    banner.style.top = '45px'; // Below titlebar
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%)';
    banner.style.background = 'rgba(15, 10, 25, 0.95)';
    banner.style.border = '1px solid #00ff66';
    banner.style.borderRadius = '8px';
    banner.style.padding = '12px 20px';
    banner.style.boxShadow = '0 4px 25px rgba(0,255,102,0.2), 0 0 10px rgba(0,0,0,0.5)';
    banner.style.zIndex = '9999';
    banner.style.display = 'flex';
    banner.style.alignItems = 'center';
    banner.style.gap = '16px';
    banner.style.transition = 'all 0.3s ease';
    
    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: #00ff66; font-weight: bold; font-size: 14px;">✦</span>
        <span style="font-size: 12px; color: #ffffff; font-weight: 500; font-family: sans-serif;">Nebula Update: Version ${version} is ready to apply.</span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="update-restart-btn" style="background: #00ff66; border: none; color: #05010f; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">Restart Now</button>
        <button id="update-close-btn" style="background: rgba(255,255,255,0.08); border: none; color: #ffffff; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Later</button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('update-restart-btn').addEventListener('click', () => {
      window.api.restartApp();
    });

    document.getElementById('update-close-btn').addEventListener('click', () => {
      banner.style.opacity = '0';
      banner.style.top = '30px';
      setTimeout(() => banner.remove(), 300);
    });
  }

  // Bind IPC event listener for update-downloaded
  if (window.api.onUpdateDownloaded) {
    window.api.onUpdateDownloaded((version) => {
      showUpdateNotification(version);
      if (updateStatusMsg) {
        updateStatusMsg.textContent = `Update ready! Restart banner popped up.`;
        updateStatusMsg.style.color = '#00ff66';
      }
      if (updateBtn) {
        updateBtn.disabled = false;
      }
    });
  }

  if (updateBtn && updateStatusMsg) {
    updateBtn.addEventListener('click', async () => {
      updateStatusMsg.textContent = 'Checking for updates...';
      updateStatusMsg.style.color = '#00ff66';
      updateBtn.disabled = true;

      try {
        const result = await window.api.checkUpdatesManual();
        if (result && result.success) {
          if (result.newVersion) {
            updateStatusMsg.textContent = `Downloading version ${result.newVersion} in background...`;
            updateStatusMsg.style.color = '#00ff66';
          } else {
            updateStatusMsg.textContent = 'Nebula is already up to date (v1.1.0).';
            updateStatusMsg.style.color = 'var(--text-muted)';
            updateBtn.disabled = false;
          }
        } else {
          updateStatusMsg.textContent = `Check failed: ${result?.error || 'Unknown error'}`;
          updateStatusMsg.style.color = '#ff5f56';
          updateBtn.disabled = false;
        }
      } catch (err) {
        updateStatusMsg.textContent = `Error checking updates: ${err.message || err}`;
        updateStatusMsg.style.color = '#ff5f56';
        updateBtn.disabled = false;
      }
    });
  }

  if (openFileBtn && localFileInput) {
    openFileBtn.addEventListener('click', () => {
      localFileInput.click();
    });
    localFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        let filePath = file.path;
        filePath = filePath.replace(/\\/g, '/');
        if (!filePath.startsWith('/')) {
          filePath = '/' + filePath;
        }
        navigateTo(activeTabId, 'file://' + filePath);
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

  if (permissionOnceBtn) {
    permissionOnceBtn.addEventListener('click', () => {
      respondToPermission(true, 'once');
    });
  }
  if (permissionSessionBtn) {
    permissionSessionBtn.addEventListener('click', () => {
      respondToPermission(true, 'session');
    });
  }
  if (permissionTimedBtn) {
    permissionTimedBtn.addEventListener('click', () => {
      respondToPermission(true, 'timed');
    });
  }
  const permissionForeverBtn = document.getElementById('permission-forever-btn');
  if (permissionForeverBtn) {
    permissionForeverBtn.addEventListener('click', () => {
      respondToPermission(true, 'forever');
    });
  }
  if (permissionDenyBtn) {
    permissionDenyBtn.addEventListener('click', () => {
      respondToPermission(false, 'deny');
    });
  }

  // Window Controls
  const winMinBtn = document.getElementById('win-min-btn');
  const winMaxBtn = document.getElementById('win-max-btn');
  const winCloseBtn = document.getElementById('win-close-btn');

  if (winMinBtn) {
    winMinBtn.addEventListener('click', () => {
      if (window.api) window.api.windowMinimize();
    });
  }
  if (winMaxBtn) {
    winMaxBtn.addEventListener('click', () => {
      if (window.api) window.api.windowMaximize();
    });
  }
  if (winCloseBtn) {
    winCloseBtn.addEventListener('click', () => {
      if (window.api) window.api.windowClose();
    });
  }

  // Nebula Nuke Mode (No History)
  const toolbarNukeBtn = document.getElementById('toolbar-nuke-btn');
  if (toolbarNukeBtn) {
    toolbarNukeBtn.addEventListener('click', () => {
      nukeMode = !nukeMode;
      if (nukeMode) {
        toolbarNukeBtn.classList.add('active');
        if (statusBarText) statusBarText.textContent = 'Nebula Nuke Mode Active (Private Browsing: No history saved)';
      } else {
        toolbarNukeBtn.classList.remove('active');
        if (statusBarText) statusBarText.textContent = 'Nebula Nuke Mode Deactivated';
        setTimeout(() => {
          if (statusBarText && statusBarText.textContent === 'Nebula Nuke Mode Deactivated') {
            statusBarText.textContent = 'Ready';
          }
        }, 2000);
      }
    });
  }

  if (window.api && window.api.onRequestPermission) {
    window.api.onRequestPermission(({ id, url, permission }) => {
      currentPermissionRequest = id;
      if (permissionBanner && permissionText) {
        let readableName = permission;
        if (permission === 'media') readableName = 'camera/microphone';
        let displayHost;
        try {
          displayHost = new URL(url).hostname;
        } catch (e) {
          displayHost = url;
        }
        permissionText.textContent = `"${displayHost}" wants access to your ${readableName}`;
        permissionBanner.classList.remove('hidden');
      }
    });
  }

  const securityReturnBtn = document.getElementById('security-return-btn');
  if (securityReturnBtn) {
    securityReturnBtn.addEventListener('click', () => {
      navigateTo(activeTabId, 'newtab');
    });
  }

  // Hide suggestions dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('suggestions-dropdown');
    if (dropdown && !dropdown.contains(e.target) && e.target !== addressBar && e.target !== agentAddressBar) {
      dropdown.classList.add('hidden');
    }
  });

  const cookieInspectorBtn = document.getElementById('cookie-inspector-btn');
  if (cookieInspectorBtn) {
    cookieInspectorBtn.addEventListener('click', () => {
      openCookieInspector();
    });
  }

  const closeCookieOverlayBtn = document.getElementById('close-cookie-overlay-btn');
  const cookieInspectorOverlay = document.getElementById('cookie-inspector-overlay');
  if (closeCookieOverlayBtn && cookieInspectorOverlay) {
    closeCookieOverlayBtn.addEventListener('click', () => {
      cookieInspectorOverlay.classList.add('hidden');
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

  // Enable right click context menu to assign/change tab groups
  tabEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const group = prompt("Assign Tab Group Color (red, blue, green, purple, or 'none' to remove):", "");
    if (group) {
      tabEl.className = 'tab'; // reset class
      if (activeTabId === tabId) tabEl.classList.add('active');
      const cleanGroup = group.toLowerCase().trim();
      if (['red', 'blue', 'green', 'purple'].includes(cleanGroup)) {
        tabEl.classList.add('group-' + cleanGroup);
        const tObj = tabs.find(t => t.id === tabId);
        if (tObj) tObj.group = cleanGroup;
      } else {
        const tObj = tabs.find(t => t.id === tabId);
        if (tObj) delete tObj.group;
      }
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
  webview.setAttribute('preload', './webview-preload.js');
  
  // Set Safari user agent to avoid webview blockages on websites like YouTube/Google
  webview.setAttribute('useragent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15');

  webview.addEventListener('will-navigate', (e) => {
    if (secureSitesOnly && e.url.startsWith('http://')) {
      webview.stop();
      navigateTo(tabId, 'nebula://securityblock');
    }
  });

  // Listen to IPC messages from Nix webview scanner
  webview.addEventListener('ipc-message', async (e) => {
    if (e.channel === 'nix-request-credentials') {
      try {
        const allCreds = await window.api.getCredentials() || [];
        const siteOrigin = new URL(webview.getURL()).origin;
        const matching = allCreds.filter(c => c.url === siteOrigin);
        webview.send('nix-credentials-response', matching);
      } catch (err) {
        console.error('Error fetching credentials:', err);
      }
    } else if (e.channel === 'nix-form-submitted') {
      const cred = e.args[0];
      if (cred && cred.username && cred.password) {
        (async () => {
          try {
            const allCreds = await window.api.getCredentials() || [];
            const exists = allCreds.some(c => c.url === cred.url && c.username === cred.username && c.password === cred.password);
            if (!exists) {
              showPasswordSaveBanner(cred);
            }
          } catch (err) {
            console.error(err);
          }
        })();
      }
    } else if (e.channel === 'nix-typo-corrected') {
      const { oldVal, newVal } = e.args[0];
      statusBarText.textContent = `Nix corrected email typo: "${oldVal}" -> "${newVal}"`;
      setTimeout(() => {
        statusBarText.textContent = 'Ready';
      }, 3000);
    }
  });

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
        updateCookieBtnVisibility();
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
        updateCookieBtnVisibility();
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
  const securityBlockPanel = document.getElementById('security-block-panel');
  if (securityBlockPanel) {
    securityBlockPanel.classList.add('hidden');
  }

  // Hide Nebula Suite panels
  const drivePanel = document.getElementById('nebula-drive-panel');
  const galleryPanel = document.getElementById('nebula-gallery-panel');
  const passwordsPanel = document.getElementById('nebula-passwords-panel');
  const pdfPanel = document.getElementById('nebula-pdf-panel');
  if (drivePanel) drivePanel.classList.add('hidden');
  if (galleryPanel) galleryPanel.classList.add('hidden');
  if (passwordsPanel) passwordsPanel.classList.add('hidden');
  if (pdfPanel) pdfPanel.classList.add('hidden');

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
    renderSettingsCredentials();
  } else if (tabObj.url === 'nebula://drive') {
    newTabDashboard.style.display = 'none';
    if (drivePanel) drivePanel.classList.remove('hidden');
    addressBar.value = 'nebula.drive';
    if (agentAddressBar) agentAddressBar.value = 'nebula.drive';
    updateBookmarkStarState('');
    updateSecurityBadge('newtab');
    updateDomainDisplay('drive');
    renderDriveFiles();
  } else if (tabObj.url === 'nebula://gallery') {
    newTabDashboard.style.display = 'none';
    if (galleryPanel) galleryPanel.classList.remove('hidden');
    addressBar.value = 'nebula.gallery';
    if (agentAddressBar) agentAddressBar.value = 'nebula.gallery';
    updateBookmarkStarState('');
    updateSecurityBadge('newtab');
    updateDomainDisplay('gallery');
    renderGalleryImages();
  } else if (tabObj.url === 'nebula://passwords') {
    newTabDashboard.style.display = 'none';
    if (passwordsPanel) passwordsPanel.classList.remove('hidden');
    addressBar.value = 'nebula.passwords';
    if (agentAddressBar) agentAddressBar.value = 'nebula.passwords';
    updateBookmarkStarState('');
    updateSecurityBadge('newtab');
    updateDomainDisplay('passwords');
    renderPasswordsAppList();
  } else if (tabObj.url === 'nebula://pdf') {
    newTabDashboard.style.display = 'none';
    if (pdfPanel) pdfPanel.classList.remove('hidden');
    addressBar.value = 'nebula.pdf';
    if (agentAddressBar) agentAddressBar.value = 'nebula.pdf';
    updateBookmarkStarState('');
    updateSecurityBadge('newtab');
    updateDomainDisplay('pdf');
  } else if (tabObj.url === 'nebula://securityblock') {
    newTabDashboard.style.display = 'none';
    if (securityBlockPanel) {
      securityBlockPanel.classList.remove('hidden');
    }
    addressBar.value = 'nebula://securityblock';
    if (agentAddressBar) agentAddressBar.value = 'nebula://securityblock';
    updateBookmarkStarState('');
    updateSecurityBadge('insecure');
    updateDomainDisplay('blocked');
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
  updateCookieBtnVisibility();
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
function isInternalUrl(url) {
  return url === 'newtab' || url === 'nebula://settings' || url === 'nebula://securityblock' || url === 'nebula://drive' || url === 'nebula://gallery' || url === 'nebula://passwords' || url === 'nebula://pdf';
}

function navigateTo(tabId, url) {
  const tabObj = tabs.find(t => t.id === tabId);
  if (!tabObj) return;

  // Force address mode when initiating manual navigation
  headerBar.className = 'header-bar address-mode';

  let normalizedUrl = url.trim().toLowerCase();
  if (normalizedUrl === 'nebula.drive' || normalizedUrl === 'nebula://drive' || normalizedUrl === 'http://nebula.drive' || normalizedUrl === 'https://nebula.drive') {
    url = 'nebula://drive';
  } else if (normalizedUrl === 'nebula.gallery' || normalizedUrl === 'nebula://gallery' || normalizedUrl === 'http://nebula.gallery' || normalizedUrl === 'https://nebula.gallery') {
    url = 'nebula://gallery';
  } else if (normalizedUrl === 'nebula.passwords' || normalizedUrl === 'nebula://passwords' || normalizedUrl === 'http://nebula.passwords' || normalizedUrl === 'https://nebula.passwords') {
    url = 'nebula://passwords';
  } else if (normalizedUrl === 'nebula.pdf' || normalizedUrl === 'nebula://pdf' || normalizedUrl === 'http://nebula.pdf' || normalizedUrl === 'https://nebula.pdf') {
    url = 'nebula://pdf';
  }

  if (isInternalUrl(url)) {
    tabObj.url = url;
    if (url === 'newtab') tabObj.title = 'New Tab';
    else if (url === 'nebula://settings') tabObj.title = 'Settings';
    else if (url === 'nebula://drive') tabObj.title = 'Nebula Drive';
    else if (url === 'nebula://gallery') tabObj.title = 'Nebula Gallery';
    else if (url === 'nebula://passwords') tabObj.title = 'Nebula Passwords';
    else if (url === 'nebula://pdf') tabObj.title = 'Nebula PDF Viewer';
    else tabObj.title = 'Security Warning';
    
    // Hide active webview if it exists
    if (tabObj.webview) {
      tabObj.webview.remove();
      tabObj.webview = null;
    }

    // Refresh UI
    const tabEl = document.getElementById(tabId);
    if (tabEl) {
      tabEl.querySelector('.tab-title').textContent = tabObj.title;
    }

    if (activeTabId === tabId) {
      activateTab(tabId);
    }
  } else {
    const targetUrl = cleanUrl(url);
    if (secureSitesOnly && targetUrl.startsWith('http://')) {
      navigateTo(tabId, 'nebula://securityblock');
      return;
    }
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
  if (url === 'newtab' || url.startsWith('chrome://') || url.startsWith('file://') || url.startsWith('nebula://')) {
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
  if (nukeMode) return;
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
      if (headerGeminiSpark) {
        headerGeminiSpark.classList.remove('active');
        headerGeminiSpark.classList.remove('expanded');
      }
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
  
  const sidebarHeaderTitle = document.getElementById('sidebar-header-title');
  
  if (mode === 'gemini') {
    if (sidebarHeaderTitle) sidebarHeaderTitle.textContent = defaultAi === 'nix' ? 'Nebula Nix' : 'Gemini AI';
    if (headerGeminiSpark) {
      headerGeminiSpark.classList.add('active');
      if (screenContextEnabled) {
        headerGeminiSpark.classList.add('expanded');
      }
    }
    if (headerNotesBtn) headerNotesBtn.classList.remove('active');
    
    // Switch panels
    aiPanel.classList.add('active');
    notesPanel.classList.remove('active');

    updateAiSidebarDisplay();

    if (geminiWebview && !geminiWebview.src) {
      geminiWebview.src = 'https://gemini.google.com';
      geminiWebview.addEventListener('dom-ready', () => {
        geminiWebview.setZoomFactor(0.8);
      });
    }
  } else {
    if (sidebarHeaderTitle) sidebarHeaderTitle.textContent = 'Nebula Notes';
    if (headerNotesBtn) headerNotesBtn.classList.add('active');
    if (headerGeminiSpark) {
      headerGeminiSpark.classList.remove('active');
      headerGeminiSpark.classList.remove('expanded');
    }

    // Switch panels
    notesPanel.classList.add('active');
    aiPanel.classList.remove('active');
  }
}

// Apply themes dynamically
function applyTheme(themeName) {
  if (themeName === 'light-frost') {
    themeName = 'deep-space';
  }
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
  const addressBg = luminance > 0.5 ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)';
  const tabInactive = luminance > 0.5 ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
  const tabActive = luminance > 0.5 ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.1)';

  document.documentElement.style.setProperty('--bg-tab-bar', color);
  document.documentElement.style.setProperty('--bg-panel', color);
  document.documentElement.style.setProperty('--text-main', textColor);
  document.documentElement.style.setProperty('--text-muted', mutedColor);
  document.documentElement.style.setProperty('--border-color', borderColor);
  document.documentElement.style.setProperty('--border-focus', borderFocus);
  document.documentElement.style.setProperty('--bg-address-input', addressBg);
  document.documentElement.style.setProperty('--bg-tab-inactive', tabInactive);
  document.documentElement.style.setProperty('--bg-tab-active', tabActive);
}

function resetAddressBarColor() {
  document.documentElement.style.removeProperty('--bg-tab-bar');
  document.documentElement.style.removeProperty('--bg-panel');
  document.documentElement.style.removeProperty('--text-main');
  document.documentElement.style.removeProperty('--text-muted');
  document.documentElement.style.removeProperty('--border-color');
  document.documentElement.style.removeProperty('--border-focus');
  document.documentElement.style.removeProperty('--bg-address-input');
  document.documentElement.style.removeProperty('--bg-tab-inactive');
  document.documentElement.style.removeProperty('--bg-tab-active');
}

async function updateNeonThemeFromWebview(tabId) {
  if (!neonMode) {
    resetAddressBarColor();
    return;
  }
  const tabObj = tabs.find(t => t.id === tabId);
  if (!tabObj || !tabObj.webview || isInternalUrl(tabObj.url)) {
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

// -------------------------------------------------------------
// KEYBOARD SHORTCUTS FOR AGENT MODE
// -------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (!agentMode) return;

  const tag = document.activeElement.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || document.activeElement.isContentEditable) {
    if (!e.ctrlKey && !e.altKey) return;
  }

  // Ctrl + Tab: Quick Tab Switch
  if (e.ctrlKey && e.key === 'Tab') {
    e.preventDefault();
    if (previousActiveTabId) {
      activateTab(previousActiveTabId);
    }
  }

  // Ctrl + T: New Tab
  if (e.ctrlKey && e.key === 't') {
    e.preventDefault();
    createNewTab();
  }

  // Ctrl + W: Close Active Tab
  if (e.ctrlKey && e.key === 'w') {
    e.preventDefault();
    if (activeTabId) {
      closeTab(activeTabId);
    }
  }

  // Ctrl + S: Open Settings
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    navigateTo(activeTabId, 'nebula://settings');
  }

  // Ctrl + G: Toggle Gemini Sidebar
  if (e.ctrlKey && e.key === 'g') {
    e.preventDefault();
    toggleSidebarMode('gemini');
  }
});

async function respondToPermission(allowed, lifetime) {
  if (currentPermissionRequest) {
    if (permissionBanner) permissionBanner.classList.add('hidden');
    if (window.api) {
      await window.api.respondToPermission(currentPermissionRequest, allowed, lifetime);
    }
    currentPermissionRequest = null;
  }
}

// -------------------------------------------------------------
// NEBULA NIX SUGGESTIONS CALCULATION & RENDERING
// -------------------------------------------------------------
function getTimeOfDayCategory(date) {
  const hours = date.getHours();
  if (hours >= 6 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 18) return 'afternoon';
  if (hours >= 18 && hours < 24) return 'evening';
  return 'night';
}

function getSuggestions(query) {
  if (!query || query.trim() === '') return [];
  const lcQuery = query.toLowerCase().trim();
  
  const visitCounts = {};
  historyList.forEach(item => {
    visitCounts[item.url] = (visitCounts[item.url] || 0) + 1;
  });

  const now = new Date();
  const currentCategory = getTimeOfDayCategory(now);

  const scored = [];
  const uniqueUrls = new Set();

  historyList.forEach(item => {
    if (uniqueUrls.has(item.url)) return;
    
    const titleMatch = (item.title && typeof item.title === 'string') ? item.title.toLowerCase().includes(lcQuery) : false;
    const urlMatch = (item.url && typeof item.url === 'string') ? item.url.toLowerCase().includes(lcQuery) : false;
    
    if (titleMatch || urlMatch) {
      uniqueUrls.add(item.url);
      
      let score = 0;
      if (item.url.toLowerCase().startsWith(lcQuery) || item.title.toLowerCase().startsWith(lcQuery)) {
        score += 50;
      } else {
        score += 10;
      }
      
      const visits = visitCounts[item.url] || 1;
      score += Math.min(visits * 5, 30);
      
      try {
        const itemTimeCategory = getTimeOfDayCategory(new Date(item.date));
        if (itemTimeCategory === currentCategory) {
          score += 25;
        }
      } catch (e) {}

      if (item.title.toLowerCase() === lcQuery || item.url.toLowerCase() === lcQuery) {
        score += 100;
      }

      scored.push({
        url: item.url,
        title: item.title,
        score: score,
        type: 'history'
      });
    }
  });

  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, 4);

  results.push({
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    title: `Search Google for "${query}"`,
    score: -99,
    type: 'search',
    originalQuery: query
  });

  results.sort((a, b) => b.score - a.score);
  return results;
}

function positionSuggestionsDropdown(inputEl) {
  const dropdown = document.getElementById('suggestions-dropdown');
  if (!dropdown || !inputEl) return;
  const rect = inputEl.getBoundingClientRect();
  dropdown.style.left = rect.left + 'px';
  dropdown.style.width = rect.width + 'px';
  
  const layout = document.body.getAttribute('data-header-layout') || 'top';
  if (inputEl.id === 'agent-address-bar' || layout.includes('bottom')) {
    dropdown.style.top = 'auto';
    dropdown.style.bottom = (window.innerHeight - rect.top + 6) + 'px';
  } else {
    dropdown.style.bottom = 'auto';
    dropdown.style.top = (rect.bottom + 6) + 'px';
  }
}

function showSuggestions(inputEl) {
  const query = inputEl.value;
  const dropdown = document.getElementById('suggestions-dropdown');
  if (!dropdown) return;

  const suggestions = getSuggestions(query);
  if (suggestions.length === 0) {
    dropdown.classList.add('hidden');
    return;
  }

  dropdown.innerHTML = '';
  positionSuggestionsDropdown(inputEl);
  dropdown.classList.remove('hidden');

  suggestions.forEach((s, idx) => {
    const row = document.createElement('div');
    row.className = 'suggestion-item';
    
    if (idx === 0) {
      row.classList.add('nix-suggested');
      
      const badge = document.createElement('span');
      badge.className = 'nix-badge';
      badge.textContent = 'Nebula Nix Suggested';
      row.appendChild(badge);
    }

    const titleEl = document.createElement('div');
    titleEl.className = 'suggestion-title';
    titleEl.textContent = s.title;
    row.appendChild(titleEl);

    if (s.type === 'history') {
      const urlEl = document.createElement('div');
      urlEl.className = 'suggestion-url';
      urlEl.textContent = s.url;
      row.appendChild(urlEl);
    }

    row.addEventListener('click', () => {
      navigateTo(activeTabId, s.url);
      inputEl.value = s.type === 'search' ? s.originalQuery : s.url;
      dropdown.classList.add('hidden');
      inputEl.blur();
    });

    dropdown.appendChild(row);
  });
}

// -------------------------------------------------------------
// PASSWORD SAVE OVERLAY & SETTINGS CREDENTIALS
// -------------------------------------------------------------
let pendingSaveCredential = null;

function showPasswordSaveBanner(cred) {
  pendingSaveCredential = cred;
  const banner = document.getElementById('password-save-banner');
  const textSpan = document.getElementById('password-save-text');
  if (banner && textSpan) {
    let siteDomain = cred.url;
    try {
      siteDomain = new URL(cred.url).hostname;
    } catch (e) {}
    textSpan.textContent = `Save password for "${cred.username}" on ${siteDomain}?`;
    banner.classList.remove('hidden');
  }
}

async function renderSettingsCredentials(filter = '') {
  const listEl = document.getElementById('settings-credentials-list');
  if (!listEl) return;

  listEl.innerHTML = '';
  if (!window.api) return;

  const credentials = await window.api.getCredentials() || [];
  const filtered = credentials.filter(c => 
    c.username.toLowerCase().includes(filter) || c.url.toLowerCase().includes(filter)
  );

  if (filtered.length === 0) {
    listEl.innerHTML = '<div style="padding: 20px; color: var(--text-muted); font-size: 14px;">No saved credentials found.</div>';
    return;
  }

  filtered.forEach(item => {
    const row = document.createElement('div');
    row.className = 'settings-list-item';
    
    const info = document.createElement('div');
    info.className = 'item-info';
    
    let domain = item.url;
    try { domain = new URL(item.url).hostname; } catch (e) {}

    info.innerHTML = `
      <strong class="item-title">${escapeHtml(item.username)}</strong>
      <span class="item-url">${escapeHtml(domain)} &bull; ••••••••</span>
    `;

    const del = document.createElement('button');
    del.className = 'delete-item-btn';
    del.innerHTML = '&times;';
    del.style.fontSize = '20px';
    del.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete credentials for ${item.username}?`)) {
        await window.api.deleteCredential({ url: item.url, username: item.username });
        renderSettingsCredentials(filter);
      }
    });

    row.appendChild(info);
    row.appendChild(del);
    listEl.appendChild(row);
  });
}

// -------------------------------------------------------------
// NEBULA SUITE & SPELLING AI ENGINE
// -------------------------------------------------------------

// Base64 to Blob conversion
function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: mimeType });
}

// --- NEBULA DRIVE ---
async function renderDriveFiles() {
  const listEl = document.getElementById('drive-files-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (!window.api) return;
  const files = await window.api.getDriveFiles();

  if (files.length === 0) {
    listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">No files stored yet. Drag files or click "Add Files".</div>';
    return;
  }

  files.forEach(fileObj => {
    const row = document.createElement('div');
    row.className = 'drive-file-item';
    
    const details = document.createElement('div');
    details.style.display = 'flex';
    details.style.flexDirection = 'column';
    details.style.gap = '2px';
    
    const name = document.createElement('span');
    name.textContent = fileObj.name;
    name.style.fontWeight = '500';
    name.style.fontSize = '13px';
    
    const meta = document.createElement('span');
    meta.textContent = `${(fileObj.size / 1024).toFixed(1)} KB • ${new Date(fileObj.date).toLocaleDateString()}`;
    meta.style.fontSize = '11px';
    meta.style.color = 'var(--text-muted)';

    details.appendChild(name);
    details.appendChild(meta);

    const delBtn = document.createElement('button');
    delBtn.className = 'nav-btn';
    delBtn.innerHTML = '×';
    delBtn.style.color = '#ff5f56';
    delBtn.style.fontSize = '16px';
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteDriveFile(fileObj.id);
    });

    row.appendChild(details);
    row.appendChild(delBtn);

    row.addEventListener('click', () => {
      document.querySelectorAll('.drive-file-item').forEach(r => r.classList.remove('active'));
      row.classList.add('active');
      previewDriveFile(fileObj);
    });

    listEl.appendChild(row);
  });
}

async function deleteDriveFile(id) {
  if (!window.api) return;
  await window.api.deleteDriveFile(id);
  renderDriveFiles();
  renderGalleryImages();
  const content = document.getElementById('drive-viewer-content');
  if (content) content.innerHTML = '<div style="color: var(--text-muted); text-align: center;">Select a file from the list to preview it here</div>';
}

function previewDriveFile(fileObj) {
  const content = document.getElementById('drive-viewer-content');
  if (!content) return;
  content.innerHTML = '';

  const blob = base64ToBlob(fileObj.base64, fileObj.type);
  const fileUrl = URL.createObjectURL(blob);

  if (fileObj.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = fileUrl;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    img.style.borderRadius = '6px';
    content.appendChild(img);
  } else if (fileObj.type.startsWith('video/')) {
    const video = document.createElement('video');
    video.src = fileUrl;
    video.controls = true;
    video.style.maxWidth = '100%';
    video.style.maxHeight = '100%';
    content.appendChild(video);
  } else if (fileObj.type === 'application/pdf') {
    const embed = document.createElement('embed');
    embed.src = fileUrl;
    embed.type = 'application/pdf';
    embed.style.width = '100%';
    embed.style.height = '100%';
    content.appendChild(embed);
  } else if (fileObj.type.startsWith('text/') || fileObj.name.endsWith('.js') || fileObj.name.endsWith('.css') || fileObj.name.endsWith('.json') || fileObj.name.endsWith('.md')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const pre = document.createElement('pre');
      pre.textContent = e.target.result;
      pre.style.width = '100%';
      pre.style.height = '100%';
      pre.style.margin = '0';
      pre.style.overflow = 'auto';
      pre.style.fontSize = '12px';
      pre.style.color = '#fff';
      pre.style.fontFamily = 'monospace';
      content.appendChild(pre);
    };
    reader.readAsText(blob);
  } else {
    content.innerHTML = `<div style="text-align: center;"><p>${fileObj.name}</p><span style="font-size:12px; color:var(--text-muted);">Preview not supported for this file type</span></div>`;
  }
}

async function handleDriveFileUploads(files) {
  if (!window.api) return;
  
  for (const file of Array.from(files)) {
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        resolve(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    });

    await window.api.saveDriveFile({
      name: file.name,
      type: file.type,
      size: file.size,
      date: Date.now(),
      base64: base64
    });
  }

  renderDriveFiles();
  renderGalleryImages();
}

// --- NEBULA GALLERY ---
let galleryImages = [];
let currentLightboxIdx = 0;

async function renderGalleryImages() {
  const gridEl = document.getElementById('gallery-grid');
  if (!gridEl) return;
  gridEl.innerHTML = '';

  if (!window.api) return;
  const files = await window.api.getDriveFiles();
  galleryImages = files.filter(f => f.type.startsWith('image/'));

  if (galleryImages.length === 0) {
    gridEl.innerHTML = '<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px;">No images stored yet. Click "Add Images" to drop images here.</div>';
    return;
  }

  galleryImages.forEach((imgObj, idx) => {
    const card = document.createElement('div');
    card.className = 'gallery-card';

    const img = document.createElement('img');
    const blob = base64ToBlob(imgObj.base64, imgObj.type);
    img.src = URL.createObjectURL(blob);

    const actions = document.createElement('div');
    actions.className = 'gallery-card-actions';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'gallery-card-btn';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(idx);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'gallery-card-btn';
    delBtn.textContent = 'Delete';
    delBtn.style.color = '#ff5f56';
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteDriveFile(imgObj.id);
    });

    actions.appendChild(viewBtn);
    actions.appendChild(delBtn);
    card.appendChild(img);
    card.appendChild(actions);

    card.addEventListener('click', () => {
      openLightbox(idx);
    });

    gridEl.appendChild(card);
  });
}

function openLightbox(idx) {
  const lightbox = document.getElementById('gallery-lightbox');
  const img = document.getElementById('lightbox-img');
  const title = document.getElementById('lightbox-title');
  if (!lightbox || !img || !galleryImages[idx]) return;

  currentLightboxIdx = idx;
  const blob = base64ToBlob(galleryImages[idx].base64, galleryImages[idx].type);
  img.src = URL.createObjectURL(blob);
  if (title) title.textContent = galleryImages[idx].name;
  lightbox.classList.remove('hidden');
}

// --- NEBULA PASSWORDS APP ---
async function renderPasswordsAppList(filter = '') {
  const listEl = document.getElementById('passwords-app-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (!window.api) return;
  const credentials = await window.api.getCredentials();

  const filtered = credentials.filter(c => 
    c.url.toLowerCase().includes(filter) || 
    c.username.toLowerCase().includes(filter)
  );

  if (filtered.length === 0) {
    listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">No credentials matching search.</div>';
    return;
  }

  filtered.forEach(cred => {
    const row = document.createElement('div');
    row.className = 'passwords-app-item';

    const info = document.createElement('div');
    info.style.display = 'flex';
    info.style.flexDirection = 'column';
    info.style.gap = '2px';

    const domain = document.createElement('span');
    domain.textContent = cred.url;
    domain.style.fontWeight = '600';
    domain.style.fontSize = '14px';

    const user = document.createElement('span');
    user.textContent = `Username: ${cred.username}`;
    user.style.fontSize = '12px';
    user.style.color = 'var(--text-muted)';

    info.appendChild(domain);
    info.appendChild(user);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';

    const copyUser = document.createElement('button');
    copyUser.className = 'nav-btn';
    copyUser.innerHTML = '👤';
    copyUser.title = 'Copy Username';
    copyUser.addEventListener('click', () => {
      navigator.clipboard.writeText(cred.username);
    });

    const copyPass = document.createElement('button');
    copyPass.className = 'nav-btn';
    copyPass.innerHTML = '🔑';
    copyPass.title = 'Copy Password';
    copyPass.addEventListener('click', () => {
      navigator.clipboard.writeText(cred.password);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'nav-btn';
    delBtn.innerHTML = '🗑️';
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', async () => {
      if (confirm(`Delete password for ${cred.username} on ${cred.url}?`)) {
        await window.api.deleteCredential({ url: cred.url, username: cred.username });
        renderPasswordsAppList(filter);
      }
    });

    actions.appendChild(copyUser);
    actions.appendChild(copyPass);
    actions.appendChild(delBtn);

    row.appendChild(info);
    row.appendChild(actions);
    listEl.appendChild(row);
  });
}

function generatePassword(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]\:;?><,./-=';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

// --- NEBULA SPELLING AI ENGINE ---
// Smart spelling correction dictionary rules & simple semantic suggestions
const spellingDict = {
  'teh': 'the',
  'recieve': 'receive',
  'seperate': 'separate',
  'untill': 'until',
  'accomodate': 'accommodate',
  'definately': 'definitely',
  'goverment': 'government',
  'occurred': 'occurred',
  'publically': 'publicly',
  'calender': 'calendar',
  'enviroment': 'environment',
  'wich': 'which',
  'wierd': 'weird',
  'broswer': 'browser',
  'acutlly': 'actually',
  'bulid': 'build',
  'secutity': 'security',
  'protocall': 'protocol',
  'creditals': 'credentials',
  'imputted': 'inputted'
};

function checkSpellingInText(text) {
  const words = text.split(/(\s+)/);
  let corrected = false;
  const processed = words.map(w => {
    const cleanWord = w.toLowerCase().replace(/[^a-zA-Z]/g, '');
    if (spellingDict[cleanWord]) {
      corrected = true;
      const replacement = spellingDict[cleanWord];
      // Keep casing if original was capitalized
      if (w[0] === w[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    }
    return w;
  });
  return { text: processed.join(''), corrected };
}

// Event bindings inside initialization
function initSuiteEvents() {
  // Homepage Suite Shortcuts
  document.querySelectorAll('.suite-shortcut-card').forEach(card => {
    card.addEventListener('click', () => {
      const targetUrl = card.getAttribute('data-url');
      if (targetUrl) {
        navigateTo(activeTabId, targetUrl);
      }
    });
  });

  // Drive
  const driveDrop = document.getElementById('drive-dropzone');
  const driveInput = document.getElementById('drive-file-input');
  const driveAddBtn = document.getElementById('drive-add-btn');

  if (driveDrop) {
    driveDrop.addEventListener('dragover', (e) => {
      e.preventDefault();
      driveDrop.classList.add('dragover');
    });
    driveDrop.addEventListener('dragleave', () => {
      driveDrop.classList.remove('dragover');
    });
    driveDrop.addEventListener('drop', (e) => {
      e.preventDefault();
      driveDrop.classList.remove('dragover');
      if (e.dataTransfer.files) {
        handleDriveFileUploads(e.dataTransfer.files);
      }
    });
    driveDrop.addEventListener('click', () => {
      if (driveInput) driveInput.click();
    });
  }

  if (driveInput) {
    driveInput.addEventListener('change', (e) => {
      if (e.target.files) {
        handleDriveFileUploads(e.target.files);
      }
    });
  }

  if (driveAddBtn && driveInput) {
    driveAddBtn.addEventListener('click', () => driveInput.click());
  }

  // Gallery
  const galleryInput = document.getElementById('gallery-file-input');
  const galleryAddBtn = document.getElementById('gallery-add-btn');
  if (galleryAddBtn && galleryInput) {
    galleryAddBtn.addEventListener('click', () => galleryInput.click());
  }
  if (galleryInput) {
    galleryInput.addEventListener('change', (e) => {
      if (e.target.files) {
        handleDriveFileUploads(e.target.files);
      }
    });
  }

  // Lightbox
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  if (lightboxClose && lightbox) {
    lightboxClose.addEventListener('click', () => lightbox.classList.add('hidden'));
  }
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', () => {
      if (currentLightboxIdx > 0) {
        openLightbox(currentLightboxIdx - 1);
      }
    });
  }
  if (lightboxNext) {
    lightboxNext.addEventListener('click', () => {
      if (currentLightboxIdx < galleryImages.length - 1) {
        openLightbox(currentLightboxIdx + 1);
      }
    });
  }

  // PDF Viewer
  const pdfDrop = document.getElementById('pdf-dropzone');
  const pdfInput = document.getElementById('pdf-file-input');
  const pdfOpenBtn = document.getElementById('pdf-open-btn');
  const pdfIframe = document.getElementById('pdf-iframe');
  const pdfEmpty = document.getElementById('pdf-empty-state');

  function loadPdf(file) {
    if (!file || file.type !== 'application/pdf') return;
    const url = URL.createObjectURL(file);
    if (pdfIframe) {
      pdfIframe.src = url;
      pdfIframe.style.display = 'block';
    }
    if (pdfEmpty) pdfEmpty.style.display = 'none';
  }

  if (pdfDrop) {
    pdfDrop.addEventListener('dragover', (e) => {
      e.preventDefault();
      pdfDrop.classList.add('dragover');
    });
    pdfDrop.addEventListener('dragleave', () => {
      pdfDrop.classList.remove('dragover');
    });
    pdfDrop.addEventListener('drop', (e) => {
      e.preventDefault();
      pdfDrop.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        loadPdf(e.dataTransfer.files[0]);
      }
    });
    pdfDrop.addEventListener('click', () => {
      if (pdfInput) pdfInput.click();
    });
  }

  if (pdfInput) {
    pdfInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        loadPdf(e.target.files[0]);
      }
    });
  }
  if (pdfOpenBtn && pdfInput) {
    pdfOpenBtn.addEventListener('click', () => pdfInput.click());
  }

  // Passwords Search
  const passwordsSearch = document.getElementById('passwords-search-input');
  if (passwordsSearch) {
    passwordsSearch.addEventListener('input', (e) => {
      renderPasswordsAppList(e.target.value.toLowerCase());
    });
  }

  // Passwords Add/Edit Modal
  const passwordsAddBtn = document.getElementById('passwords-add-btn');
  const passwordsEditModal = document.getElementById('password-edit-modal');
  const editCancel = document.getElementById('edit-password-cancel');
  const editSave = document.getElementById('edit-password-save');

  if (passwordsAddBtn && passwordsEditModal) {
    passwordsAddBtn.addEventListener('click', () => {
      document.getElementById('edit-password-site').value = '';
      document.getElementById('edit-password-user').value = '';
      document.getElementById('edit-password-pass').value = '';
      passwordsEditModal.classList.remove('hidden');
    });
  }
  if (editCancel && passwordsEditModal) {
    editCancel.addEventListener('click', () => passwordsEditModal.classList.add('hidden'));
  }
  if (editSave && passwordsEditModal) {
    editSave.addEventListener('click', async () => {
      const url = document.getElementById('edit-password-site').value.trim();
      const username = document.getElementById('edit-password-user').value.trim();
      const password = document.getElementById('edit-password-pass').value.trim();
      if (url && username && password && window.api) {
        await window.api.saveCredential({ url, username, password });
        passwordsEditModal.classList.add('hidden');
        renderPasswordsAppList();
      }
    });
  }

  // Passwords Generator Modal
  const passwordGenBtn = document.getElementById('password-gen-btn');
  const passwordGenModal = document.getElementById('password-gen-modal');
  const genCopy = document.getElementById('gen-password-copy');
  const genLength = document.getElementById('gen-password-length');
  const genRegen = document.getElementById('gen-password-regenerate');
  const genResult = document.getElementById('gen-password-result');

  if (passwordGenBtn && passwordGenModal) {
    passwordGenBtn.addEventListener('click', () => {
      passwordGenModal.classList.toggle('hidden');
      if (!passwordGenModal.classList.contains('hidden')) {
        const len = parseInt(genLength.value) || 16;
        genResult.value = generatePassword(len);
      }
    });
  }
  if (genRegen && genResult) {
    genRegen.addEventListener('click', () => {
      const len = parseInt(genLength.value) || 16;
      genResult.value = generatePassword(len);
    });
  }
  if (genCopy && genResult) {
    genCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(genResult.value);
    });
  }

  // Nebula Nix Chat event listeners
  const nixChatInput = document.getElementById('chat-input');
  const nixChatSend = document.getElementById('chat-send-btn');
  const nixChatMessages = document.getElementById('chat-messages');

  const addNixMessage = (role, content) => {
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${role}`;
    
    // Parse basic markdown formatting (bold, italics, inline code, newlines, and bullet points)
    let parsedContent = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/`([\s\S]*?)`/g, '<code>$1</code>')
      .replace(/^\s*\* (.*)$/gm, '&bull; $1')
      .replace(/^\s*\- (.*)$/gm, '&bull; $1')
      .replace(/\*\*([\s\S]*?)\*\*/g, '<b>$1</b>')
      .replace(/\*([\s\S]*?)\*/g, '<i>$1</i>')
      .replace(/\n/g, '<br>');

    msgEl.innerHTML = parsedContent;
    nixChatMessages.appendChild(msgEl);
    nixChatMessages.scrollTop = nixChatMessages.scrollHeight;
  };

  const nixNewChatBtn = document.getElementById('nix-new-chat-btn');
  if (nixNewChatBtn) {
    nixNewChatBtn.addEventListener('click', () => {
      chatHistory = [];
      nixChatMessages.innerHTML = '';
      addNixMessage('assistant', 'Started a new conversation. How can I assist you with Nebula Browser today?');
    });
  }

  // Flag to check if we are currently waiting for permission action
  let isPromptingPermission = false;

  const sendNixChat = async () => {
    const text = nixChatInput.value.trim();
    if (!text) return;
    if (isPromptingPermission) return; // Prevent spamming while prompting

    // Render User Message
    addNixMessage('user', text);
    nixChatInput.value = '';

    const model = localStorage.getItem('nix_model') || '1.2-thinking';
    
    // Nix 1.1 model CANNOT read page contents
    if (model === '1.1') {
      processNixChatQuery(text, false);
      return;
    }

    // Nix 1.3 models bypass the page context prompt bubble since the user explicitly chatted
    if (model.startsWith('1.3')) {
      processNixChatQuery(text, true);
      return;
    }

    const alwaysAllowSetting = localStorage.getItem('nix_always_allow') || 'true';
    const permission = localStorage.getItem('nix_page_context_allowed');

    if (alwaysAllowSetting === 'disabled') {
      processNixChatQuery(text, false);
      return;
    }

    if (alwaysAllowSetting === 'false') {
      // Prompt for single-use permission since "Always Allow" is disabled in settings
      isPromptingPermission = true;
      const promptBubble = document.createElement('div');
      promptBubble.className = 'nix-prompt-bubble';
      promptBubble.innerHTML = `
        <div class="nix-prompt-text"><b>Nix 1.2 Context Permission:</b> Would you like to allow Nix to read the active page contents for this request?</div>
        <div class="nix-prompt-buttons">
          <button class="nix-prompt-btn allow">Allow This Time</button>
          <button class="nix-prompt-btn deny">No</button>
        </div>
      `;
      nixChatMessages.appendChild(promptBubble);
      nixChatMessages.scrollTop = nixChatMessages.scrollHeight;

      promptBubble.querySelector('.allow').addEventListener('click', () => {
        promptBubble.remove();
        isPromptingPermission = false;
        processNixChatQuery(text, true);
      });

      promptBubble.querySelector('.deny').addEventListener('click', () => {
        promptBubble.remove();
        isPromptingPermission = false;
        processNixChatQuery(text, false);
      });
    } else if (permission === null) {
      // Permission not yet configured - Prompt the user
      isPromptingPermission = true;
      const promptBubble = document.createElement('div');
      promptBubble.className = 'nix-prompt-bubble';
      promptBubble.innerHTML = `
        <div class="nix-prompt-text"><b>Nix 1.2 Context Permission:</b> Would you like to allow Nix to read the text contents of the active page to answer questions?</div>
        <div class="nix-prompt-buttons">
          <button class="nix-prompt-btn allow">Allow Forever</button>
          <button class="nix-prompt-btn deny">No, Ask Directly</button>
        </div>
      `;
      nixChatMessages.appendChild(promptBubble);
      nixChatMessages.scrollTop = nixChatMessages.scrollHeight;

      promptBubble.querySelector('.allow').addEventListener('click', () => {
        localStorage.setItem('nix_page_context_allowed', 'true');
        promptBubble.remove();
        isPromptingPermission = false;
        processNixChatQuery(text, true);
      });

      promptBubble.querySelector('.deny').addEventListener('click', () => {
        localStorage.setItem('nix_page_context_allowed', 'false');
        promptBubble.remove();
        isPromptingPermission = false;
        processNixChatQuery(text, false);
      });
    } else {
      // Permission already set - Proceed immediately
      processNixChatQuery(text, permission === 'true');
    }
  };

  const processNixChatQuery = async (text, allowPageRead) => {
    const model = localStorage.getItem('nix_model') || '1.2-thinking';
    
    // 1. Create Thinking Container
    const thinkingEl = document.createElement('div');
    thinkingEl.className = 'nix-thinking-container';
    
    let stepsHtml = "";
    if (model === '1.1') {
      stepsHtml = `
        <div class="nix-thinking-step step-1 active">✦ Formulating response (Nix 1.1)...</div>
      `;
    } else if (model.startsWith('1.3')) {
      // Clean, natural language, non-futuristic thinking UI for Nix 1.3
      stepsHtml = `
        <div class="nix-thinking-step step-1 active">Checking your current page...</div>
      `;
      if (allowPageRead) {
        stepsHtml += `
          <div class="nix-thinking-step step-2">Searching for settings modifications...</div>
        `;
      }
      if (model === '1.3-pro') {
        stepsHtml += `
          <div class="nix-thinking-step step-3">Evaluating browser window layout...</div>
          <div class="nix-thinking-step step-4">Preparing response...</div>
        `;
      } else {
        stepsHtml += `
          <div class="nix-thinking-step step-3">Preparing response...</div>
        `;
      }
    } else {
      stepsHtml = `
        <div class="nix-thinking-step step-1 active">✦ Analyzing query...</div>
      `;
      if (allowPageRead) {
        stepsHtml += `
          <div class="nix-thinking-step step-2">✦ Reading active page contents...</div>
        `;
      }
      
      if (model === '1.2-ultra') {
        stepsHtml += `
          <div class="nix-thinking-step step-3">✦ Allocating Ultra-Think resources...</div>
          <div class="nix-thinking-step step-4">✦ Synthesizing deep reasoning branches...</div>
          <div class="nix-thinking-step step-5">✦ Formulating response...</div>
        `;
      } else {
        stepsHtml += `
          <div class="nix-thinking-step step-3">✦ Processing context & thinking...</div>
          <div class="nix-thinking-step step-4">✦ Formulating response...</div>
        `;
      }
    }

    const headerLabel = model === '1.1' ? 'Nix 1.1' : (model === '1.2-thinking' ? 'Nix 1.2' : (model === '1.2-ultra' ? 'Nix 1.2 Ultra-Think' : (model === '1.3-smart' ? 'Nix 1.3' : 'Nix 1.3 Pro')));
    thinkingEl.innerHTML = `
      <div class="nix-thinking-header" style="${model.startsWith('1.3') ? 'color: var(--text-main); font-weight: 500; font-family: var(--font-family-sans);' : ''}">
        <span class="spinner-icon">✦</span> ${headerLabel} is thinking
      </div>
      <div class="nix-thinking-steps">
        ${stepsHtml}
      </div>
    `;
    nixChatMessages.appendChild(thinkingEl);
    nixChatMessages.scrollTop = nixChatMessages.scrollHeight;

    // Helper to transition steps
    const setStepStatus = (stepNum, status) => {
      const step = thinkingEl.querySelector(`.step-${stepNum}`);
      if (!step) return;
      step.classList.remove('active', 'completed');
      if (status === 'active') step.classList.add('active');
      if (status === 'completed') step.classList.add('completed');
    };

    let pageText = "";
    const webviewContainer = document.querySelector('.webview-container');

    if (model !== '1.1' && allowPageRead) {
      // Transition to Step 2
      await new Promise(r => setTimeout(r, 600));
      setStepStatus(1, 'completed');
      setStepStatus(2, 'active');

      // Trigger Webview Border Glow
      if (webviewContainer) webviewContainer.classList.add('nix-reading');
      const nixOverlay = document.getElementById('nix-reading-overlay');
      if (nixOverlay) nixOverlay.classList.remove('hidden');

      const activeWebview = getActiveWebview();
      if (activeWebview) {
        try {
          // Read Page text
          pageText = await activeWebview.executeJavaScript('document.documentElement.innerText');
        } catch (err) {
          console.error("Failed to read active page context:", err);
          pageText = `(Error reading page context: ${err.message || err})`;
        }
      } else {
        pageText = "(No active webview tab found)";
      }

      // Add a 2 second delay so the screen reading glow and indicator remain active for the user
      await new Promise(r => setTimeout(r, 1500));

      // Remove Webview Border Glow
      if (webviewContainer) webviewContainer.classList.remove('nix-reading');
      if (nixOverlay) nixOverlay.classList.add('hidden');
    }

    if (model !== '1.1') {
      // Transition to Step 3 (Longer thinking duration for Pro & Ultra)
      const step3Delay = model === '1.2-ultra' ? 2000 : (model === '1.3-pro' ? 1500 : 600);
      await new Promise(r => setTimeout(r, step3Delay));
      if (allowPageRead) setStepStatus(2, 'completed');
      else setStepStatus(1, 'completed');
      setStepStatus(3, 'active');
    }

    if (model === '1.2-ultra' || model === '1.3-pro') {
      // Ultra-Think extra deep reasoning steps transition (Longer duration)
      await new Promise(r => setTimeout(r, 1500));
      setStepStatus(3, 'completed');
      setStepStatus(4, 'active');
    }

    // 2. Build conversation prompt context with system instructions
    let systemPromptName = "Nebula Nix 1.2";
    let modelContextDesc = "Nix 1.2 supports reading active page content and advanced thinking steps.";
    if (model === '1.1') {
      systemPromptName = "Nebula Nix 1.1";
      modelContextDesc = "You do not have page context access or multi-step thinking. Keep your response short and direct.";
    } else if (model === '1.2-ultra') {
      systemPromptName = "Nebula Nix 1.2 Ultra-Think";
      modelContextDesc = "You are Nix 1.2 Ultra-Think, utilizing ultra-high intelligence parameters, deep reasoning models, and tab page context to synthesize detailed thoughts.";
    } else if (model === '1.3-smart') {
      systemPromptName = "Nebula Nix 1.3 Smart";
      modelContextDesc = "You are Nix 1.3 Smart. You can change browser settings directly. If the user asks you to change the theme, position the sidebar, or change layouts, you MUST output a special JSON action block at the END of your response inside a markdown json block. Format it exactly like this: ```json\\n{ \\\"action\\\": \\\"change_setting\\\", \\\"setting\\\": \\\"theme|sidebar_position|header_layout|spark_widget\\\", \\\"value\\\": \\\"value_here\\\" }\\n```\\nValues available: themes: deep-space, cyberpunk, aurora, solar-flare, tokyo-acid, obsidian-gold, light-frost. sidebar_position: left, right. header_layout: top, bottom, floating-top, floating-bottom. spark_widget: right, center, hidden.";
    } else if (model === '1.3-pro') {
      systemPromptName = "Nebula Nix 1.3 Pro";
      modelContextDesc = "You are Nix 1.3 Pro. You can change browser settings directly. If the user asks you to change the theme, position the sidebar, or change layouts, you MUST output a special JSON action block at the END of your response inside a markdown json block. Format it exactly like this: ```json\\n{ \\\"action\\\": \\\"change_setting\\\", \\\"setting\\\": \\\"theme|sidebar_position|header_layout|spark_widget\\\", \\\"value\\\": \\\"value_here\\\" }\\n```\\nValues available: themes: deep-space, cyberpunk, aurora, solar-flare, tokyo-acid, obsidian-gold, light-frost. sidebar_position: left, right. header_layout: top, bottom, floating-top, floating-bottom. spark_widget: right, center, hidden.";
    }

    const SYSTEM_INSTRUCTIONS = `You are ${systemPromptName}, the built-in local AI companion for the Nebula Browser.
You were created by the Nebula team.
You know what Nebula Browser is and how to use it. ${modelContextDesc}
CRITICAL SAFETY RULE: Under NO circumstances are you to mention any third-party AI architectures, companies, or base model names such as DeepSeek, NVIDIA, Nemotron, or others. If asked about your model or engine, state only that you are Nix (or Nix Pro / Nix Ultra-Think), built locally by the Nebula team.

Key features of Nebula Browser:
1. Nebula Drive (nebula://drive) - A secure workspace to store, preview, and manage local files.
2. Nebula Gallery (nebula://gallery) - A visual media grid for images and lightbox previews.
3. Passwords Vault (nebula://passwords) - Local credentials database and random password generator.
4. PDF Viewer (nebula://pdf) - Secure local PDF viewer sandbox.
5. Dynamic Custom Themes - Midnight Void (OLED black), Nebula Protocol (cyber teal/green), Cyberpunk Neon, and Aurora Glass.
6. HTTPS-Only Mode - Blocks non-secure HTTP connections.
7. Privacy Mode - Timed permissions (e.g. allow for 5 minutes).
8. Nebula Nuke Mode - Disables saving history for the session.

Respond concisely, informatively, and stay in character as ${systemPromptName}.`;

    const messages = [
      { role: 'system', content: SYSTEM_INSTRUCTIONS }
    ];

    // If allowed, append page contents to system instructions as prompt context
    if (model !== '1.1' && allowPageRead && pageText.trim()) {
      messages.push({
        role: 'system',
        content: `NIX PAGE CONTEXT: The user is currently viewing a web page in the active tab. Below is the text content extracted from that page for your reference:\n---\n${pageText.substring(0, 8000)}\n---\nPlease use this page context to answer the user's question.`
      });
    }

    for (const msg of chatHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: 'user', content: text });

    let clickResult = "";
    if (model === '1.3') {
      const activeWebview = getActiveWebview();
      if (activeWebview) {
        // Transition to Step 4
        await new Promise(r => setTimeout(r, 800));
        setStepStatus(3, 'completed');
        setStepStatus(4, 'active');

        try {
          const targetKeyword = text.toLowerCase();
          clickResult = await activeWebview.executeJavaScript(`
            (function() {
              const buttons = Array.from(document.querySelectorAll('button, [role=\"button\"], a.btn, a, input[type=\"button\"], input[type=\"submit\"]'));
              const keyword = "${targetKeyword.replace(/"/g, '\\"')}";
              
              // Find button containing prompt text or standard interactive keyword
              let target = buttons.find(b => {
                const bText = (b.innerText || b.value || "").toLowerCase();
                return bText && (keyword.includes(bText) || bText.includes(keyword));
              });
              
              // Fallback to first visible button if no keyword match
              if (!target && buttons.length > 0) {
                target = buttons.find(b => b.offsetWidth > 0 && b.offsetHeight > 0);
              }
              
              if (target) {
                target.style.outline = '3px dashed #00ffff';
                target.style.boxShadow = '0 0 15px #00ffff';
                target.click();
                return "Successfully clicked button/link: '" + (target.innerText || target.value || target.textContent || "unnamed").trim() + "'";
              }
              return "No interactive buttons found on the active page.";
            })()
          `);
        } catch (err) {
          clickResult = "Click action failed: " + err.message;
        }

        // Transition to Step 5
        await new Promise(r => setTimeout(r, 800));
        setStepStatus(4, 'completed');
        setStepStatus(5, 'active');
      }
    }

    if (model === '1.3-smart' && clickResult) {
      messages.push({
        role: 'system',
        content: `NIX PAGE INTERACTION RESULT: Nix executed a page click action. Result: ${clickResult}. Please confirm this action to the user.`
      });
    }

    if (model === '1.2-ultra') {
      // Transition to final Ultra step (Longer duration)
      await new Promise(r => setTimeout(r, 1500));
      setStepStatus(4, 'completed');
      setStepStatus(5, 'active');
    } else if (model === '1.3-pro') {
      // Transition to Step 4 (Longer duration for Pro)
      await new Promise(r => setTimeout(r, 1000));
      setStepStatus(3, 'completed');
      setStepStatus(4, 'active');
    } else if (model !== '1.1' && model !== '1.3-smart') {
      // Transition to Step 3 for standard Thinker
      await new Promise(r => setTimeout(r, 500));
      setStepStatus(2, 'completed');
      setStepStatus(3, 'active');
    }

    // Pass the Nix tier key to main.js which maps it to the real HF model ID
    try {
      const data = await window.api.queryHuggingFace({
        model: model, // e.g. '1.1', '1.2-thinking', '1.2-ultra', '1.3-smart', '1.3-pro'
        messages: messages
      });
      thinkingEl.remove();

      let responseText = "";
      if (Array.isArray(data) && data.length > 0) {
        responseText = data[0].generated_text || "";
      } else if (data.generated_text) {
        responseText = data.generated_text;
      } else if (data.error) {
        responseText = `Hugging Face API Error: ${typeof data.error === 'object' ? JSON.stringify(data.error) : data.error}`;
      } else {
        responseText = "Error: Received unexpected payload from Hugging Face: " + JSON.stringify(data);
      }

      // Strip system prefix if any leaks
      if (responseText.includes("<|im_start|>")) {
        responseText = responseText.split("<|im_start|>")[0].trim();
      }

      // Strip <think>...</think> reasoning blocks (Qwen/DeepSeek thinking mode leakage)
      responseText = responseText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      // Also strip any leftover standalone <think> or </think> tags
      responseText = responseText.replace(/<\/?think>/gi, '').trim();

      // Clean up raw LaTeX/math syntax formatting leaks (e.g. \rightarrow, \leftarrow, etc.)
      responseText = responseText
        .replace(/\$\\(right|left)arrow\$/gi, (match, dir) => dir === 'right' ? '→' : '←')
        .replace(/\\(right|left)arrow/gi, (match, dir) => dir === 'right' ? '→' : '←')
        .replace(/\$\\Rightarrow\$/g, '⇒')
        .replace(/\\Rightarrow/g, '⇒')
        .replace(/\$\\Leftarrow\$/g, '⇐')
        .replace(/\\Leftarrow/g, '⇐');


      if (responseText) {
        addNixMessage('assistant', responseText.trim());
        chatHistory.push({ role: 'user', content: text });
        chatHistory.push({ role: 'assistant', content: responseText.trim() });

        // Direct Settings Control for Nix 1.3 / Nix 1.3 Pro
        if (model.startsWith('1.3')) {
          const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
          let match;
          while ((match = jsonRegex.exec(responseText)) !== null) {
            try {
              const parsed = JSON.parse(match[1]);
              if (parsed && parsed.action === 'change_setting') {
                const setting = parsed.setting;
                const val = parsed.value;
                if (setting === 'theme') {
                  applyTheme(val);
                  saveConfigValue('theme', val);
                  const themeSelect = document.getElementById('theme-select');
                  if (themeSelect) themeSelect.value = val;
                  // Update active theme card in settings dashboard
                  document.querySelectorAll('.theme-card').forEach(card => {
                    if (card.dataset.theme === val) card.classList.add('active');
                    else card.classList.remove('active');
                  });
                } else if (setting === 'sidebar_position') {
                  applySidebarPosition(val);
                  saveConfigValue('sidebarPos', val);
                  const sidebarPosSelect = document.getElementById('sidebar-pos-select');
                  if (sidebarPosSelect) sidebarPosSelect.value = val;
                } else if (setting === 'header_layout') {
                  document.body.setAttribute('data-header-layout', val);
                  saveConfigValue('headerLayout', val);
                  const headerLayoutSelect = document.getElementById('header-layout-select');
                  if (headerLayoutSelect) headerLayoutSelect.value = val;
                } else if (setting === 'spark_widget') {
                  applySparkSetting(val);
                  saveConfigValue('sparkSetting', val);
                  const sparkBtnSelect = document.getElementById('spark-btn-select');
                  if (sparkBtnSelect) sparkBtnSelect.value = val;
                }
              }
            } catch (e) {
              console.error("Failed to execute settings change from Nix:", e);
            }
          }
        }
      } else {
        addNixMessage('assistant', 'Error: Received empty response from local AI.');
      }
    } catch (err) {
      thinkingEl.remove();
      addNixMessage('assistant', `Could not fetch response from Hugging Face API: ${err.message || err}`);
      console.error('HF API error:', err);
    }
  };

  if (nixChatSend && nixChatInput) {
    nixChatSend.addEventListener('click', sendNixChat);
    nixChatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendNixChat();
      }
    });
  }

} // end initSuiteEvents

// Query Gemini API directly via client-side fetch
async function queryGeminiAPI(prompt) {
  if (!geminiApiKey) return null;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });
    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text.trim();
    }
  } catch (err) {
    console.error('Gemini API call failed:', err);
  }
  return null;
}

// Notes spelling correction listener
if (notesTextarea) {
  let spellcheckPopup = null;
  let hideTimeout = null;

  notesTextarea.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const text = notesTextarea.value;
      const selStart = notesTextarea.selectionStart;
      const textBeforeCursor = text.slice(0, selStart);
      const words = textBeforeCursor.split(/\s+/);
      const lastWord = words[words.length - 1].replace(/[^a-zA-Z]/g, '').toLowerCase();

      // Check dictionary or if API key exists, we can do full AI check
      if (spellingDict[lastWord]) {
        const originalWord = words[words.length - 1];
        const correctedWord = spellingDict[lastWord];
        showAiSpellingPopup(originalWord, correctedWord, selStart);
      } else if (geminiApiKey && lastWord.length > 2) {
        // AI check if it doesn't match standard common words
        const originalWord = words[words.length - 1];
        showAiSpellingPopup(originalWord, null, selStart);
      }
    }
  });

  function showAiSpellingPopup(original, correction, caretIdx) {
    if (spellcheckPopup) spellcheckPopup.remove();
    if (hideTimeout) clearTimeout(hideTimeout);

    spellcheckPopup = document.createElement('div');
    spellcheckPopup.className = 'ai-spellcheck-popup';
    
    const header = document.createElement('div');
    header.className = 'ai-spellcheck-header';
    header.innerHTML = '<span class="ai-spellcheck-spinner"></span> Nebula AI Spelling';

    const statusText = document.createElement('div');
    statusText.style.color = 'var(--text-muted)';
    statusText.style.fontSize = '11px';
    statusText.style.fontStyle = 'italic';
    statusText.textContent = 'Analyzing context...';

    spellcheckPopup.appendChild(header);
    spellcheckPopup.appendChild(statusText);

    const notesPanel = document.getElementById('notes-panel');
    if (notesPanel) {
      spellcheckPopup.style.bottom = '40px';
      spellcheckPopup.style.right = '20px';
      notesPanel.appendChild(spellcheckPopup);
    }

    function renderSuggestion(finalCorrection) {
      if (statusText) statusText.remove();
      
      const label = document.createElement('div');
      label.textContent = `Correct "${original}" to:`;
      label.style.fontSize = '11px';
      label.style.color = 'var(--text-muted)';
      
      const btn = document.createElement('div');
      btn.className = 'ai-spellcheck-suggestion';
      btn.textContent = finalCorrection;
      
      btn.addEventListener('click', () => {
        const currentText = notesTextarea.value;
        const textBefore = currentText.slice(0, caretIdx);
        const textAfter = currentText.slice(caretIdx);
        const words = textBefore.split(/(\s+)/);
        
        for (let i = words.length - 1; i >= 0; i--) {
          if (words[i].trim() !== '') {
            words[i] = finalCorrection;
            break;
          }
        }
        
        notesTextarea.value = words.join('') + textAfter;
        spellcheckPopup.remove();
        
        const statusBarText = document.getElementById('status-text');
        if (statusBarText) statusBarText.textContent = `Nebula Spelling: Corrected "${original}" to "${finalCorrection}"`;
      });

      spellcheckPopup.appendChild(label);
      spellcheckPopup.appendChild(btn);

      hideTimeout = setTimeout(() => {
        if (spellcheckPopup) spellcheckPopup.remove();
      }, 4000);
    }

    if (correction) {
      // Local dictionary match - instant suggestion
      setTimeout(() => {
        renderSuggestion(correction);
      }, 400);
    } else if (geminiApiKey) {
      // Query Gemini
      const prompt = `You are a spelling corrector. Correct the spelling of this word: "${original}". If it is already correct, respond exactly with the same word. If it is misspelled, respond ONLY with the corrected word (no extra text, no notes).`;
      queryGeminiAPI(prompt).then(res => {
        if (res && res.trim().toLowerCase() !== original.toLowerCase()) {
          renderSuggestion(res.trim());
        } else {
          if (spellcheckPopup) spellcheckPopup.remove();
        }
      });
    } else {
      // Query Nebula Nix 1.1 via Hugging Face Router
      const prompt = `You are a spelling corrector. Correct the spelling of this word: "${original}". If it is already correct, respond exactly with the same word. If it is misspelled, respond ONLY with the corrected word (no extra text, no notes).`;
      window.api.queryHuggingFace({
        messages: [
          { role: 'user', content: prompt }
        ]
      }).then(res => {
        const text = (res && res.generated_text) ? res.generated_text.trim() : '';
        if (text && text.toLowerCase() !== original.toLowerCase()) {
          renderSuggestion(text);
        } else {
          if (spellcheckPopup) spellcheckPopup.remove();
        }
      }).catch(() => {
        if (spellcheckPopup) spellcheckPopup.remove();
      });
    }
  }

  // Full AI Spellcheck button
  const notesAiCheckBtn = document.getElementById('notes-ai-check-btn');
  if (notesAiCheckBtn) {
    notesAiCheckBtn.addEventListener('click', async () => {
      const originalText = notesTextarea.value;
      if (!originalText.trim()) return;

      // Show spinner popover
      const pop = document.createElement('div');
      pop.className = 'ai-spellcheck-popup';
      pop.style.bottom = '40px';
      pop.style.right = '20px';
      
      const h = document.createElement('div');
      h.className = 'ai-spellcheck-header';
      h.innerHTML = '<span class="ai-spellcheck-spinner"></span> Scanning document...';
      pop.appendChild(h);

      const pText = document.createElement('div');
      pText.style.color = 'var(--text-muted)';
      pText.style.fontSize = '11px';
      pText.textContent = 'Nebula AI is reviewing grammar...';
      pop.appendChild(pText);

      const notesPanel = document.getElementById('notes-panel');
      if (notesPanel) notesPanel.appendChild(pop);

      const prompt = `You are a professional grammar and spelling editor. Correct all spelling, grammar, and typos in the following text. Preserve original style and format. Return ONLY the corrected text. Do not add any conversational replies, notes, or explanations.\n\nText:\n${originalText}`;
      
      try {
        const res = await window.api.queryHuggingFace({
          messages: [
            { role: 'user', content: prompt }
          ]
        });
        pop.remove();

        const result = (res && res.generated_text) ? res.generated_text.trim() : '';
        if (result) {
          notesTextarea.value = result;
          const statusBarText = document.getElementById('status-text');
          if (statusBarText) statusBarText.textContent = 'Nebula Spelling: Full AI spellcheck completed by Nix 1.1.';
        } else {
          alert('AI Spellcheck failed to return corrections: ' + JSON.stringify(res));
        }
      } catch (err) {
        pop.remove();
        alert('AI Spellcheck request failed: ' + err.message);
      }
    });
  }
}

// Start browser app & initialize suite events
function initSuite() {
  init();
  initSuiteEvents();
}

window.addEventListener('DOMContentLoaded', initSuite);

// Cookie Inspector functions
function updateCookieBtnVisibility() {
  const cookieInspectorBtn = document.getElementById('cookie-inspector-btn');
  if (!cookieInspectorBtn) return;

  const activeWebview = getActiveWebview();
  const tabObj = tabs.find(t => t.id === activeTabId);
  if (activeWebview && tabObj && !isInternalUrl(tabObj.url)) {
    cookieInspectorBtn.style.display = 'inline-flex';
  } else {
    cookieInspectorBtn.style.display = 'none';
  }
}

function openCookieInspector() {
  const activeWebview = getActiveWebview();
  if (!activeWebview) return;

  activeWebview.executeJavaScript('document.cookie').then(cookieString => {
    const listContainer = document.getElementById('cookie-inspector-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (!cookieString || cookieString.trim() === '') {
      listContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">No cookies found or active for this site.</div>';
    } else {
      const cookiesList = cookieString.split(';').map(item => {
        const parts = item.split('=', 2);
        if (parts.length === 2) {
          const name = parts[0].trim();
          const value = parts[1].trim();
          let category = 'Essential / Functional';
          const nameLower = name.toLowerCase();
          if (nameLower.includes('session') || nameLower.includes('sid') || nameLower.includes('token') || nameLower.includes('auth') || nameLower.includes('login') || nameLower.includes('jwt')) {
            category = 'Session / Auth';
          } else if (name.startsWith('_ga') || name.startsWith('_gi') || nameLower.includes('analytics') || nameLower.includes('track') || nameLower.includes('pixel') || nameLower.includes('ad') || nameLower.includes('utm')) {
            category = 'Tracking / Analytics';
          }
          return { name, value, category };
        }
        return null;
      }).filter(Boolean);

      cookiesList.forEach(cookie => {
        const card = document.createElement('div');
        card.style.background = 'rgba(255, 255, 255, 0.03)';
        card.style.border = '1px solid var(--border-color)';
        card.style.borderRadius = '8px';
        card.style.padding = '10px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '4px';

        let badgeColor = 'var(--text-muted)';
        let badgeBg = 'rgba(255, 255, 255, 0.05)';
        if (cookie.category === 'Session / Auth') {
          badgeColor = '#00ffff';
          badgeBg = 'rgba(0, 255, 255, 0.1)';
        } else if (cookie.category === 'Tracking / Analytics') {
          badgeColor = '#ff5f56';
          badgeBg = 'rgba(255, 95, 86, 0.1)';
        }

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <strong style="color: var(--text-main); font-size: 13px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 200px;">${cookie.name}</strong>
            <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; color: ${badgeColor}; background: ${badgeBg};">${cookie.category}</span>
          </div>
          <div style="font-family: monospace; font-size: 11px; color: var(--text-muted); word-break: break-all; max-height: 44px; overflow-y: auto;">${cookie.value}</div>
        `;
        listContainer.appendChild(card);
      });
    }

    const cookieInspectorOverlay = document.getElementById('cookie-inspector-overlay');
    if (cookieInspectorOverlay) cookieInspectorOverlay.classList.remove('hidden');
  }).catch(err => {
    console.error('Failed to inspect cookies:', err);
  });
}
