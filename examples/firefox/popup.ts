/**
 * Firefox Popup Example
 * Uses @zovo/types-firefox-extension (browser namespace)
 */

import { browser } from '@zovo/types-firefox-extension';

// Firefox uses 'browser' instead of 'chrome'
async function getActiveTab(): Promise<browser.tabs.Tab | null> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

async function openSidebar(): Promise<void> {
  // Firefox-specific: Sidebar API
  await browser.sidebar.open();
}

async function getTheme(): Promise<browser.theme.Theme> {
  return await browser.theme.getCurrent();
}

async function setTheme(): Promise<void> {
  await browser.theme.update({
    colors: {
      accentcolor: '#0078d4',
      textcolor: '#ffffff'
    }
  });
}

// Firefox-specific menus
browser.menus?.create?.({
  id: 'my-menu-item',
  title: 'My Menu Item',
  contexts: ['page_action']
});

export { getActiveTab, openSidebar, getTheme, setTheme };
