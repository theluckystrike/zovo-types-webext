
import type { chrome } from '../packages/types-chrome-extension/src/index';

// Test chrome.storage
chrome.storage.local.get(['key'], (result) => {
  console.log(result);
});

chrome.storage.sync.set({ key: 'value' }, () => {
  console.log('Saved');
});

// Test storage area type
const storage: chrome.storage.StorageArea = {
  get: (keys, callback) => {},
  set: (items, callback) => {},
  remove: (keys, callback) => {},
  clear: (callback) => {}
};
