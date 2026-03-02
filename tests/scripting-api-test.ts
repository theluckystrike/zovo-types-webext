
import type { chrome } from '../packages/types-chrome-extension/src/index';

// Test chrome.scripting
const scriptOptions: chrome.scripting.ScriptInjection = {
  target: { tabId: 1 },
  func: () => { document.body.innerHTML = 'injected'; },
  injectImmediately: true
};

chrome.scripting.executeScript(scriptOptions, (results) => {
  console.log(results);
});

// Test contentScriptOptions
const contentScript: chrome.scripting.RegisteredContentScript = {
  id: 'my-script',
  matches: ['<all_urls>'],
  js: ['content.js']
};
