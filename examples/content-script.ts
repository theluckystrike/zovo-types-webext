/**
 * Content Script
 * Uses @zovo/types-chrome-extension for full type safety
 */

import { chrome } from '@zovo/types-chrome-extension';

// ==================== DOM Interaction ====================

interface PageData {
  title: string;
  url: string;
  links: string[];
  images: string[];
}

/**
 * Extract page data
 */
function extractPageData(): PageData {
  const links = Array.from(document.querySelectorAll('a[href]'))
    .map(a => a.href)
    .filter(h => h.startsWith('http'));
  
  const images = Array.from(document.querySelectorAll('img[src]'))
    .map(img => img.src)
    .filter(s => s.startsWith('http'));
  
  return {
    title: document.title,
    url: window.location.href,
    links,
    images
  };
}

// ==================== Message to Background ====================

/**
 * Send data to background script
 */
async function sendToBackground(data: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(data, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// ==================== Execute Script Example ====================

/**
 * Inject and execute script in page
 */
async function injectScript(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      return {
        title: document.title,
        readyState: document.readyState
      };
    },
    world: 'MAIN'
  });
  
  console.log('Script results:', results);
}

// ==================== Inject CSS ====================

/**
 * Inject styles into page
 */
async function injectStyles(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  
  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    css: `
      body {
        border: 3px solid red !important;
      }
    `,
    cssOrigin: 'USER'
  });
}

// ==================== Mutation Observer ====================

/**
 * Observe DOM changes and notify background
 */
function observeDOM(): void {
  const observer = new MutationObserver((mutations) => {
    const data = extractPageData();
    sendToBackground({ type: 'PAGE_DATA', payload: data });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Content script loaded');
  observeDOM();
});

export { extractPageData, sendToBackground, injectScript, injectStyles };
