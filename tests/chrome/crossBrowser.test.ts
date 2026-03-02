/**
 * Cross-Browser Compatibility Tests
 * Tests that common APIs work across browsers
 */

import { browser } from '@zovo/types-firefox-extension';

describe('Cross-Browser WebExtensions', () => {
  describe('Common APIs', () => {
    it('should have tabs.query in Firefox', async () => {
      const tabs = await browser.tabs.query({ active: true });
      expect(tabs).toBeDefined();
    });

    it('should have storage.local in Firefox', async () => {
      await browser.storage.local.set({ test: 'value' });
      const result = await browser.storage.local.get('test');
      expect(result.test).toBe('value');
    });

    it('should have runtime.sendMessage in Firefox', async () => {
      expect(typeof browser.runtime.sendMessage).toBe('function');
    });

    it('should have runtime.onMessage in Firefox', () => {
      expect(browser.runtime.onMessage).toBeDefined();
    });
  });
});
