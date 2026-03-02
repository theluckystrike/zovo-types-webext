
import type { webext } from '../packages/types-webext-common/src/index';

// Test common API types
function getActiveTab(callback: (tab: any) => void) {
  // This should work in all browsers
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    callback(tabs[0]);
  });
}
