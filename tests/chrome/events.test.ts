/**
 * Events API Type Tests
 * Validates chrome.events type definitions
 */

import { chrome } from '@zovo/types-chrome-extension';

describe('chrome.events', () => {
  describe('Event', () => {
    it('should have addListener method', () => {
      const event = chrome.tabs.onUpdated;
      expect(typeof event.addListener).toBe('function');
    });

    it('should have removeListener method', () => {
      const event = chrome.tabs.onUpdated;
      expect(typeof event.removeListener).toBe('function');
    });

    it('should have hasListener method', () => {
      const event = chrome.tabs.onUpdated;
      expect(typeof event.hasListener).toBe('function');
    });

    it('should have hasListeners method', () => {
      const event = chrome.tabs.onUpdated;
      expect(typeof event.hasListeners).toBe('function');
    });

    it('should have getRules method', () => {
      const event = chrome.tabs.onUpdated;
      expect(typeof event.getRules).toBe('function');
    });

    it('should have updateRules method', () => {
      const event = chrome.tabs.onUpdated;
      expect(typeof event.updateRules).toBe('function');
    });
  });

  describe('URLFilter', () => {
    it('should validate URL filter patterns', () => {
      const filter: chrome.events.UrlFilter = {
        urlMatches: '.*\.example\.com.*',
        schemes: ['https'],
        ports: [443, 8080]
      };
      expect(filter).toBeDefined();
    });
  });
});
