const { ipcRenderer } = require('electron');

// Common email domains to auto-correct
const TYPO_MAP = {
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.co': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com'
};

document.addEventListener('DOMContentLoaded', () => {
  scanFormFields();
  // Periodically scan for dynamically inserted forms (single page apps)
  setInterval(scanFormFields, 2000);
});

function scanFormFields() {
  const inputs = document.querySelectorAll('input:not([data-nix-bound])');
  if (inputs.length === 0) return;

  inputs.forEach(input => {
    input.setAttribute('data-nix-bound', 'true');
    const type = input.type.toLowerCase();

    // Typo auto-correction for email fields
    if (type === 'email' || input.name.toLowerCase().includes('email')) {
      input.addEventListener('blur', () => {
        const value = input.value.trim();
        const parts = value.split('@');
        if (parts.length === 2) {
          const domain = parts[1].toLowerCase();
          if (TYPO_MAP[domain]) {
            const corrected = parts[0] + '@' + TYPO_MAP[domain];
            input.value = corrected;
            
            // Dispatch input and change events so page framework is updated
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Trigger visual notification toast in parent window
            ipcRenderer.sendToHost('nix-typo-corrected', { oldVal: value, newVal: corrected });
          }
        }
      });
    }

    // Insert floating Nix Badge next to username/email/password inputs
    if (type === 'password' || type === 'email' || type === 'text' && (input.name.toLowerCase().includes('user') || input.name.toLowerCase().includes('login') || input.name.toLowerCase().includes('email'))) {
      wrapAndInjectBadge(input);
    }
  });
}

function wrapAndInjectBadge(input) {
  // Ensure parent has position relative or set up wrapper
  const parent = input.parentElement;
  if (!parent) return;

  // If already has badge in sibling, don't repeat
  if (parent.querySelector('.nix-autofill-badge')) return;

  // Create floating Nix badge
  const badge = document.createElement('div');
  badge.className = 'nix-autofill-badge';
  badge.title = 'Nebula Nix Autofill';
  badge.innerHTML = `
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  `;

  // Inject CSS directly in page context if not present
  injectInPageStyles();

  // Position badge absolute over input
  // Position input container wrapper or absolute position badge inside parent
  const oldPos = window.getComputedStyle(parent).position;
  if (oldPos !== 'absolute' && oldPos !== 'relative' && oldPos !== 'fixed') {
    parent.style.position = 'relative';
  }

  // Position badge inside input container
  badge.style.position = 'absolute';
  badge.style.right = '10px';
  badge.style.top = '50%';
  badge.style.transform = 'translateY(-50%)';
  badge.style.zIndex = '99999';

  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    // Request credentials from host process
    ipcRenderer.sendToHost('nix-request-credentials', {
      inputType: input.type
    });
    
    // Store active input element
    window.activeNixInput = input;
  });

  parent.appendChild(badge);
}

// Receive credentials from host
ipcRenderer.on('nix-credentials-response', (event, credentials) => {
  const input = window.activeNixInput;
  if (!input) return;

  // Remove existing dropdown if any
  removeExistingDropdown();

  if (!credentials || credentials.length === 0) {
    showNoCredentialsPopup(input);
    return;
  }

  // Create dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'nix-autofill-dropdown';
  
  const rect = input.getBoundingClientRect();
  dropdown.style.left = rect.left + 'px';
  dropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
  dropdown.style.width = rect.width + 'px';

  credentials.forEach(cred => {
    const item = document.createElement('div');
    item.className = 'nix-dropdown-item';
    item.innerHTML = `
      <div style="font-weight: 600; font-size: 12px; color: #f0f3f9;">${cred.username}</div>
      <div style="font-size: 10px; color: #959cb3;">Saved Password</div>
    `;

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      fillCredentials(cred.username, cred.password);
      removeExistingDropdown();
    });

    dropdown.appendChild(item);
  });

  document.body.appendChild(dropdown);

  // Close dropdown on click outside
  const closeHandler = () => {
    removeExistingDropdown();
    document.removeEventListener('click', closeHandler);
  };
  setTimeout(() => {
    document.addEventListener('click', closeHandler);
  }, 100);
});

function fillCredentials(user, pass) {
  // Find fields
  const passwordField = document.querySelector('input[type="password"]');
  const userField = window.activeNixInput && window.activeNixInput.type !== 'password' 
    ? window.activeNixInput 
    : document.querySelector('input[type="email"], input[type="text"]');

  if (userField) {
    userField.value = user;
    userField.dispatchEvent(new Event('input', { bubbles: true }));
    userField.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (passwordField) {
    passwordField.value = pass;
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    passwordField.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function removeExistingDropdown() {
  const exist = document.querySelector('.nix-autofill-dropdown');
  if (exist) exist.remove();
}

function showNoCredentialsPopup(input) {
  const dropdown = document.createElement('div');
  dropdown.className = 'nix-autofill-dropdown';
  dropdown.style.padding = '10px 14px';
  dropdown.style.color = '#959cb3';
  dropdown.style.fontSize = '12px';
  dropdown.textContent = 'No credentials saved for this site.';
  
  const rect = input.getBoundingClientRect();
  dropdown.style.left = rect.left + 'px';
  dropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
  dropdown.style.width = rect.width + 'px';

  document.body.appendChild(dropdown);
  setTimeout(() => {
    dropdown.remove();
  }, 2000);
}

// Injected styling for page context
let stylesInjected = false;
function injectInPageStyles() {
  if (stylesInjected) return;
  const css = `
    .nix-autofill-badge {
      display: flex !important;
      align-items: center;
      justify-content: center;
      color: #00ffff !important;
      background: rgba(0, 255, 255, 0.1) !important;
      border: 1px solid rgba(0, 255, 255, 0.25) !important;
      border-radius: 50% !important;
      width: 20px !important;
      height: 20px !important;
      cursor: pointer !important;
      transition: all 0.25s ease !important;
      box-shadow: 0 0 8px rgba(0, 255, 255, 0.2) !important;
    }
    .nix-autofill-badge:hover {
      background: rgba(0, 255, 255, 0.35) !important;
      box-shadow: 0 0 12px rgba(0, 255, 255, 0.5) !important;
      transform: translateY(-50%) scale(1.1) !important;
    }
    .nix-autofill-dropdown {
      position: absolute !important;
      background: rgba(26, 27, 38, 0.92) !important;
      backdrop-filter: blur(12px) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-radius: 8px !important;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 255, 255, 0.15) !important;
      z-index: 99999999 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }
    .nix-dropdown-item {
      padding: 10px 14px !important;
      cursor: pointer !important;
      transition: all 0.2s !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-start !important;
    }
    .nix-dropdown-item:last-child {
      border-bottom: none !important;
    }
    .nix-dropdown-item:hover {
      background: rgba(0, 255, 255, 0.08) !important;
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  stylesInjected = true;
}

// Intercept form submissions
window.addEventListener('submit', (e) => {
  const form = e.target;
  const usernameInput = form.querySelector('input[type="email"], input[type="text"]');
  const passwordInput = form.querySelector('input[type="password"]');
  
  if (passwordInput && passwordInput.value) {
    const cred = {
      url: window.location.origin,
      username: usernameInput ? usernameInput.value : '',
      password: passwordInput.value
    };
    ipcRenderer.sendToHost('nix-form-submitted', cred);
  }
}, true);
