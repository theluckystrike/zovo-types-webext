/**
 * Scripting API Type Tests
 * Validates chrome.scripting type definitions
 */

import { chrome } from '@zovo/types-chrome-extension';

describe('chrome.scripting', () => {
  describe('executeScript', () => {
    it('should accept injection details', async () => {
      const [tab] = await chrome.tabs.query({ active: true });
      if (tab?.id) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => document.title
        });
        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
      }
    });

    it('should accept files array', async () => {
      const [tab] = await chrome.tabs.query({ active: true });
      if (tab?.id) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-script.js']
        });
        expect(results).toBeDefined();
      }
    });

    it('should support injectDetails with world', async () => {
      const [tab] = await chrome.tabs.query({ active: true });
      if (tab?.id) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          func: () => window.location.href
        });
        expect(results).toBeDefined();
      }
    });
  });

  describe('insertCSS', () => {
    it('should accept CSS injection details', async () => {
      const [tab] = await chrome.tabs.query({ active: true });
      if (tab?.id) {
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          css: 'body { background: white; }'
        });
      }
    });
  });

  describe('removeCSS', () => {
    it('should accept CSS removal details', async () => {
      const [tab] = await chrome.tabs.query({ active: true });
      if (tab?.id) {
        await chrome.scripting.removeCSS({
          target: { tabId: tab.id },
          css: 'body { background: white; }'
        });
      }
    });
  });

  describe('getScripts', () => {
    it('should have getRegisteredScripts method', async () => {
      expect(typeof chrome.scripting.getRegisteredScripts).toBe('function');
    });
  });
});
