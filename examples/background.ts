/**
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
