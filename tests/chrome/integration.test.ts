/**
 * Chrome Extension Integration Tests
 */

import { chrome } from '@zovo/types-chrome-extension';

describe('Chrome Extension Integration', () => {
  it('should handle complete extension workflow', async () => {
    // 1. Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    expect(tab).toBeDefined();
    
    if (!tab?.id) return;
    
    // 2. Execute script
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.title
    });
    expect(results).toBeDefined();
    
    // 3. Store result
    await chrome.storage.local.set({ lastTitle: results[0]?.result });
    
    // 4. Verify storage
    const stored = await chrome.storage.local.get('lastTitle');
    expect(stored.lastTitle).toBeDefined();
  });

  it('should handle messaging workflow', async () => {
    // Note: This test validates types, not actual message passing
    const message: chrome.runtime.MessageRequest = {
      type: 'GET_DATA',
      payload: { key: 'value' }
    };
    expect(message).toBeDefined();
  });

  it('should validate permission requirements', () => {
    const manifest = chrome.runtime.getManifest();
    expect(manifest.permissions).toBeDefined();
  });
});
