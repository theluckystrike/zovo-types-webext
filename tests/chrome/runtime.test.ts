/**
 * Runtime API Type Tests
 * Validates chrome.runtime type definitions
 */

import { chrome } from '@zovo/types-chrome-extension';

describe('chrome.runtime', () => {
  describe('getManifest', () => {
    it('should return manifest object', () => {
      const manifest = chrome.runtime.getManifest();
      expect(manifest).toBeDefined();
      expect(manifest.manifest_version).toBeDefined();
      expect(manifest.name).toBeDefined();
      expect(manifest.version).toBeDefined();
    });
  });

  describe('getURL', () => {
    it('should convert relative paths to full URLs', () => {
      const url = chrome.runtime.getURL('popup.html');
      expect(url).toMatch(/^chrome-extension:///);
    });
  });

  describe('sendMessage', () => {
    it('should accept message payload', async () => {
      // This will error without a listener, but types should be valid
      try {
        await chrome.runtime.sendMessage({ type: 'TEST', data: 'hello' });
      } catch (e) {
        // Expected - no listener
      }
    });
  });

  describe('onMessage', () => {
    it('should have proper event definition', () => {
      expect(chrome.runtime.onMessage).toBeDefined();
      expect(typeof chrome.runtime.addListener).toBe('function');
    });
  });

  describe('onInstalled', () => {
    it('should have onInstalled event', () => {
      expect(chrome.runtime.onInstalled).toBeDefined();
    });
  });

  describe('onStartup', () => {
    it('should have onStartup event', () => {
      expect(chrome.runtime.onStartup).toBeDefined();
    });
  });

  describe('getPackageDirectoryEntry', () => {
    it('should have getPackageDirectoryEntry method', () => {
      expect(typeof chrome.runtime.getPackageDirectoryEntry).toBe('function');
    });
  });
});
