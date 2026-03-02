
import type { chrome } from '../packages/types-chrome-extension/src/index';
import type { browser } from '../packages/types-firefox-extension/src/index';

// Test cross-browser compatibility
function handleMessage(message: any) {
  // Chrome API
  chrome.runtime.sendMessage(message);
  
  // Firefox API  
  browser.runtime.sendMessage(message);
}
