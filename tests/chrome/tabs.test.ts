/**
 * Tabs API Type Tests
 * Validates chrome.tabs type definitions
 */

import { chrome } from '@zovo/types-chrome-extension';

describe('chrome.tabs', () => {
  describe('query', () => {
    it('should accept query object parameters', async () => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      expect(tabs).toBeDefined();
      expect(Array.isArray(tabs)).toBe(true);
    });

    it('should return tabs with all expected properties', async () => {
      const [tab] = await chrome.tabs.query({ active: true });
      if (tab) {
        // Required properties
        expect(typeof tab.id).toBe('number');
        expect(typeof tab.windowId).toBe('number');
        
        // Optional properties
        if (tab.url !== undefined) expect(typeof tab.url).toBe('string');
        if (tab.title !== undefined) expect(typeof tab.title).toBe('string');
        if (tab.favIconUrl !== undefined) expect(typeof tab.favIconUrl).toBe('string');
        if (tab.status !== undefined) expect(['loading', 'complete']).toContain(tab.status);
      }
    });
  });

  describe('create', () => {
    it('should accept create properties', async () => {
      const tab = await chrome.tabs.create({ 
        url: 'https://example.com',
        active: true,
        pinned: false
      });
      expect(tab).toBeDefined();
    });
  });

  describe('update', () => {
    it('should accept update properties', async () => {
      const [tab] = await chrome.tabs.query({ active: true });
      if (tab?.id) {
        const updated = await chrome.tabs.update(tab.id, { 
          pinned: true,
          muted: { muted: true }
        });
        expect(updated).toBeDefined();
      }
    });
  });

  describe('events', () => {
    it('should have proper event type definitions', () => {
      expect(chrome.tabs.onCreated).toBeDefined();
      expect(chrome.tabs.onUpdated).toBeDefined();
      expect(chrome.tabs.onRemoved).toBeDefined();
      expect(chrome.tabs.onActivated).toBeDefined();
    });
  });
});
