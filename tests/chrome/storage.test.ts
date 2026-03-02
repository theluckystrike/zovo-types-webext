/**
 * Storage API Type Tests
 * Validates chrome.storage type definitions
 */

import { chrome } from '@zovo/types-chrome-extension';

describe('chrome.storage', () => {
  describe('local', () => {
    it('should set and get string values', async () => {
      await chrome.storage.local.set({ key: 'test-value' });
      const result = await chrome.storage.local.get('key');
      expect(result.key).toBe('test-value');
    });

    it('should handle complex objects', async () => {
      const complexData = {
        user: { name: 'Test', id: 123 },
        settings: { theme: 'dark', notifications: true },
        array: [1, 2, 3]
      };
      await chrome.storage.local.set(complexData);
      const result = await chrome.storage.local.get(null);
      expect(result).toHaveProperty('user');
    });

    it('should remove values', async () => {
      await chrome.storage.local.set({ temp: 'value' });
      await chrome.storage.local.remove('temp');
      const result = await chrome.storage.local.get('temp');
      expect(result.temp).toBeUndefined();
    });

    it('should clear all values', async () => {
      await chrome.storage.local.clear();
      const result = await chrome.storage.local.get(null);
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('sync', () => {
    it('should work with sync storage', async () => {
      await chrome.storage.sync.set({ synced: 'value' });
      const result = await chrome.storage.sync.get('synced');
      expect(result.synced).toBe('value');
    });

    it('should have storageBytesInUse', async () => {
      const bytes = await chrome.storage.local.getBytesInUse();
      expect(typeof bytes).toBe('number');
    });
  });

  describe('onChanged', () => {
    it('should have onChanged event', () => {
      expect(chrome.storage.onChanged).toBeDefined();
    });
  });
});
