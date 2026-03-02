
import type { chrome } from '../packages/types-chrome-extension/src/index';

// Test chrome.runtime
chrome.runtime.getManifest();

chrome.runtime.getURL('popup.html');

chrome.runtime.sendMessage({ type: 'ping' }, (response) => {
  console.log(response);
});

// Test runtime.MessageSender
const sender: chrome.runtime.MessageSender = {
  id: 'extension-id',
  url: 'https://example.com',
  tab: { id: 1, windowId: 1, url: 'https://example.com', active: true }
};
