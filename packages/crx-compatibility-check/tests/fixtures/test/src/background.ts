
chrome.tabs.create({ url: 'https://example.com' });
chrome.storage.local.set({ key: 'value' });
chrome.sidePanel.setOptions({ path: 'panel.html' });
chrome.webRequest.onBeforeRequest.addListener();
