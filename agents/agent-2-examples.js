/**
 * AGENT 2: Example Generator
 * Generates comprehensive usage examples for all APIs
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = '/Users/mike/zovo-types';
const EXAMPLES_DIR = path.join(PROJECT_ROOT, 'examples');

console.log('🤖 AGENT 2: Example Generator\n');
console.log('='.repeat(60));

// Example templates
const examples = {
  // Manifest V3 example
  manifest: `{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0",
  "description": "Example extension using @zovo/types-chrome-extension",
  "permissions": [
    "storage",
    "tabs",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://*/*",
    "http://*/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://*/*"],
      "js": ["content.js"]
    }
  ]
}
`,

  // Background service worker with full typing
  background: `/**
 * Background Service Worker
 * Full TypeScript typing with @zovo/types-chrome-extension
 */

import { chrome } from '@zovo/types-chrome-extension';

// Type definitions for messages
interface TabMessage {
  type: 'GET_TABS' | 'UPDATE_TAB' | 'CLOSE_TAB';
  payload?: {
    tabId?: number;
    updates?: chrome.tabs.UpdateProperties;
  };
}

interface ResponseMessage {
  type: 'TABS_DATA' | 'TAB_UPDATED' | 'ERROR';
  payload: unknown;
}

// ==================== Tab Management ====================

/**
 * Get all active tabs across windows
 */
async function getActiveTabs(): Promise<chrome.tabs.Tab[]> {
  return await chrome.tabs.query({ active: true });
}

/**
 * Create a new tab with specific URL
 */
async function createTab(url: string): Promise<chrome.tabs.Tab> {
  return await chrome.tabs.create({ url, active: true });
}

/**
 * Update tab properties
 */
async function updateTab(tabId: number, updates: chrome.tabs.UpdateProperties): Promise<chrome.tabs.Tab> {
  return await chrome.tabs.update(tabId, updates);
}

/**
 * Close specific tab
 */
async function closeTab(tabId: number): Promise<void> {
  await chrome.tabs.remove(tabId);
}

// ==================== Storage ====================

/**
 * Storage manager with type safety
 */
class StorageManager<T extends Record<string, unknown>> {
  constructor(private area: chrome.storage.StorageArea) {}

  async get<K extends keyof T>(key: K): Promise<Pick<T, K>>;
  async get(keys: (keyof T)[]): Promise<Partial<T>>;
  async get(keys?: string | string[] | null): Promise<Partial<T>> {
    return await this.area.get(keys as string | string[] | null) as Partial<T>;
  }

  async set(items: Partial<T>): Promise<void> {
    await this.area.set(items as Record<string, unknown>);
  }

  async remove(key: keyof T): Promise<void> {
    await this.area.remove(key as string);
  }

  async clear(): Promise<void> {
    await this.area.clear();
  }
}

// Initialize storage with type
const localStorage = new StorageManager<{
  settings: { theme: 'light' | 'dark'; notifications: boolean };
  user: { name: string; id: string };
  cache: Record<string, unknown>;
}>(chrome.storage.local);

// ==================== Message Passing ====================

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener(
  (message: TabMessage, sender: chrome.runtime.MessageSender, sendResponse: (response: ResponseMessage) => void) => {
    console.log('Received message:', message, 'from:', sender);
    
    (async () => {
      switch (message.type) {
        case 'GET_TABS': {
          const tabs = await getActiveTabs();
          sendResponse({ type: 'TABS_DATA', payload: tabs });
          break;
        }
        
        case 'UPDATE_TAB': {
          if (message.payload?.tabId && message.payload?.updates) {
            const updated = await updateTab(message.payload.tabId, message.payload.updates);
            sendResponse({ type: 'TAB_UPDATED', payload: updated });
          }
          break;
        }
        
        case 'CLOSE_TAB': {
          if (message.payload?.tabId) {
            await closeTab(message.payload.tabId);
            sendResponse({ type: 'TABS_DATA', payload: null });
          }
          break;
        }
      }
    })();
    
    return true; // Will respond asynchronously
  }
);

// ==================== Event Handlers ====================

/**
 * Tab update listener with detailed typing
 */
chrome.tabs.onUpdated.addListener(
  (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
    console.log('Tab updated:', tabId, changeInfo);
    
    if (changeInfo.status === 'complete' && tab.url?.startsWith('https://')) {
      // Log secure tab completion
      console.log('Secure tab loaded:', tab.url);
    }
  }
);

/**
 * Tab activation handler
 */
chrome.tabs.onActivated.addListener(
  (activeInfo: chrome.tabs.TabActiveInfo) => {
    console.log('Tab activated:', activeInfo.tabId, 'in window:', activeInfo.windowId);
  }
);

/**
 * Extension installation handler
 */
chrome.runtime.onInstalled.addListener(
  (details: chrome.runtime.InstallDetails) => {
    console.log('Extension installed:', details.reason);
    
    if (details.reason === 'install') {
      // First time setup
      localStorage.set({
        settings: { theme: 'light', notifications: true },
        user: { name: '', id: '' },
        cache: {}
      });
    }
  }
);

// ==================== Storage Change Listener ====================

/**
 * Monitor storage changes
 */
chrome.storage.onChanged.addListener(
  (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    console.log('Storage changed in', areaName, ':', changes);
  }
);

// ==================== Export for testing ====================

export {
  getActiveTabs,
  createTab,
  updateTab,
  closeTab,
  StorageManager
};
`,

  // Content script with scripting API
  contentScript: `/**
 * Content Script
 * Uses @zovo/types-chrome-extension for full type safety
 */

import { chrome } from '@zovo/types-chrome-extension';

// ==================== DOM Interaction ====================

interface PageData {
  title: string;
  url: string;
  links: string[];
  images: string[];
}

/**
 * Extract page data
 */
function extractPageData(): PageData {
  const links = Array.from(document.querySelectorAll('a[href]'))
    .map(a => a.href)
    .filter(h => h.startsWith('http'));
  
  const images = Array.from(document.querySelectorAll('img[src]'))
    .map(img => img.src)
    .filter(s => s.startsWith('http'));
  
  return {
    title: document.title,
    url: window.location.href,
    links,
    images
  };
}

// ==================== Message to Background ====================

/**
 * Send data to background script
 */
async function sendToBackground(data: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(data, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// ==================== Execute Script Example ====================

/**
 * Inject and execute script in page
 */
async function injectScript(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      return {
        title: document.title,
        readyState: document.readyState
      };
    },
    world: 'MAIN'
  });
  
  console.log('Script results:', results);
}

// ==================== Inject CSS ====================

/**
 * Inject styles into page
 */
async function injectStyles(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  
  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    css: \`
      body {
        border: 3px solid red !important;
      }
    \`,
    cssOrigin: 'USER'
  });
}

// ==================== Mutation Observer ====================

/**
 * Observe DOM changes and notify background
 */
function observeDOM(): void {
  const observer = new MutationObserver((mutations) => {
    const data = extractPageData();
    sendToBackground({ type: 'PAGE_DATA', payload: data });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Content script loaded');
  observeDOM();
});

export { extractPageData, sendToBackground, injectScript, injectStyles };
`,

  // Popup with React-like patterns
  popup: `/**
 * Popup Script
 * Example using @zovo/types-chrome-extension
 */

import { chrome } from '@zovo/types-chrome-extension';

// ==================== State Management ====================

interface PopupState {
  tabs: chrome.tabs.Tab[];
  isLoading: boolean;
  error: string | null;
}

let state: PopupState = {
  tabs: [],
  isLoading: false,
  error: null
};

// ==================== DOM Updates ====================

function render(): void {
  const root = document.getElementById('app');
  if (!root) return;
  
  if (state.isLoading) {
    root.innerHTML = '<div class="loading">Loading...</div>';
    return;
  }
  
  if (state.error) {
    root.innerHTML = \`<div class="error">\${state.error}</div>\`;
    return;
  }
  
  root.innerHTML = \`
    <div class="tabs">
      \${state.tabs.map(tab => \`
        <div class="tab" data-id="\${tab.id}">
          <span class="favicon">🌐</span>
          <span class="title">\${tab.title || 'Untitled'}</span>
          <span class="url">\${new URL(tab.url || '').hostname}</span>
        </div>
      \`).join('')}
    </div>
    <button id="refresh">Refresh</button>
    <button id="newTab">New Tab</button>
  \`;
}

// ==================== Event Handlers ====================

async function loadTabs(): Promise<void> {
  state.isLoading = true;
  render();
  
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    state.tabs = tabs;
    state.error = null;
  } catch (e) {
    state.error = e instanceof Error ? e.message : 'Failed to load tabs';
  }
  
  state.isLoading = false;
  render();
}

async function createNewTab(): Promise<void> {
  const tab = await chrome.tabs.create({ url: 'https://example.com' });
  console.log('Created tab:', tab.id);
}

// ==================== Initialize ====================

document.addEventListener('DOMContentLoaded', () => {
  loadTabs();
  
  document.getElementById('refresh')?.addEventListener('click', loadTabs);
  document.getElementById('newTab')?.addEventListener('click', createNewTab);
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(() => {
  loadTabs();
});

export {};
`,

  // Firefox-specific example
  firefoxPopup: `/**
 * Firefox Popup Example
 * Uses @zovo/types-firefox-extension (browser namespace)
 */

import { browser } from '@zovo/types-firefox-extension';

// Firefox uses 'browser' instead of 'chrome'
async function getActiveTab(): Promise<browser.tabs.Tab | null> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

async function openSidebar(): Promise<void> {
  // Firefox-specific: Sidebar API
  await browser.sidebar.open();
}

async function getTheme(): Promise<browser.theme.Theme> {
  return await browser.theme.getCurrent();
}

async function setTheme(): Promise<void> {
  await browser.theme.update({
    colors: {
      accentcolor: '#0078d4',
      textcolor: '#ffffff'
    }
  });
}

// Firefox-specific menus
browser.menus?.create?.({
  id: 'my-menu-item',
  title: 'My Menu Item',
  contexts: ['page_action']
});

export { getActiveTab, openSidebar, getTheme, setTheme };
`
};

// Create examples directory
if (!fs.existsSync(EXAMPLES_DIR)) {
  fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
}

// Write all examples
const exampleFiles = {
  'manifest.json': examples.manifest,
  'background.ts': examples.background,
  'content-script.ts': examples.contentScript,
  'popup.ts': examples.popup,
  'firefox/popup.ts': examples.firefoxPopup
};

Object.entries(exampleFiles).forEach(([filename, content]) => {
  const filepath = path.join(EXAMPLES_DIR, filename);
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filepath, content);
  console.log(`✅ Created example: ${filename}`);
});

// Generate index file
const indexContent = `# Examples

This directory contains comprehensive examples for using @zovo types in your browser extensions.

## Quick Examples

### Manifest V3
See [manifest.json](manifest.json) for a complete MV3 manifest.

### Background Script
See [background.ts](background.ts) for a full background service worker example with:
- Tab management
- Storage with type-safe wrapper
- Message passing
- Event handlers

### Content Script
See [content-script.ts](content-script.ts) for content script examples with:
- DOM manipulation
- Script injection
- CSS injection
- Background communication

### Popup
See [popup.ts](popup.ts) for popup UI examples with:
- State management
- Event handling
- Tab interaction

### Firefox
See [firefox/popup.ts](firefox/popup.ts) for Firefox-specific APIs:
- Browser namespace
- Sidebar API
- Theme API

## Usage

\`\`\`bash
# Install types
npm install @zovo/types-chrome-extension

# In your TypeScript files
import { chrome } from '@zovo/types-chrome-extension';
\`\`\`
`;

fs.writeFileSync(path.join(EXAMPLES_DIR, 'README.md'), indexContent);
console.log('✅ Created examples README');

console.log('\n📊 Examples Summary:');
console.log(`   - 5 example files created`);
console.log(`   - Covers: manifest, background, content, popup, Firefox`);

console.log('\n✅ AGENT 2 COMPLETE: Examples generated');
