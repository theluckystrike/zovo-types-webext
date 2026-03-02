
import type { chrome } from '../packages/types-chrome-extension/src/index';

// Test chrome.tabs API
const tab: chrome.tabs.Tab = {
  id: 1,
  windowId: 1,
  url: 'https://example.com',
  active: true,
  pinned: false
};

// Test chrome.tabs.query
chrome.tabs.query({ active: true }, (tabs) => {
  console.log(tabs);
});

// Test chrome.tabs.create
chrome.tabs.create({ url: 'https://example.com' }, (tab) => {
  console.log(tab.id);
});
