/**
 * Popup Script
 * Example using @zovo/types-chrome-extension
 */

import { chrome } from '@zovo/types-chrome-extension';

// ==================== State Management ====================

interface PopupState {
  tabs: chrome.tabs.Tab[];
  isLoading: boolean;
  error: string | null;
}

let state: PopupState = {
  tabs: [],
  isLoading: false,
  error: null
};

// ==================== DOM Updates ====================

function render(): void {
  const root = document.getElementById('app');
  if (!root) return;
  
  if (state.isLoading) {
    root.innerHTML = '<div class="loading">Loading...</div>';
    return;
  }
  
  if (state.error) {
    root.innerHTML = `<div class="error">${state.error}</div>`;
    return;
  }
  
  root.innerHTML = `
    <div class="tabs">
      ${state.tabs.map(tab => `
        <div class="tab" data-id="${tab.id}">
          <span class="favicon">🌐</span>
          <span class="title">${tab.title || 'Untitled'}</span>
          <span class="url">${new URL(tab.url || '').hostname}</span>
        </div>
      `).join('')}
    </div>
    <button id="refresh">Refresh</button>
    <button id="newTab">New Tab</button>
  `;
}

// ==================== Event Handlers ====================

async function loadTabs(): Promise<void> {
  state.isLoading = true;
  render();
  
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    state.tabs = tabs;
    state.error = null;
  } catch (e) {
    state.error = e instanceof Error ? e.message : 'Failed to load tabs';
  }
  
  state.isLoading = false;
  render();
}

async function createNewTab(): Promise<void> {
  const tab = await chrome.tabs.create({ url: 'https://example.com' });
  console.log('Created tab:', tab.id);
}

// ==================== Initialize ====================

document.addEventListener('DOMContentLoaded', () => {
  loadTabs();
  
  document.getElementById('refresh')?.addEventListener('click', loadTabs);
  document.getElementById('newTab')?.addEventListener('click', createNewTab);
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(() => {
  loadTabs();
});

export {};
