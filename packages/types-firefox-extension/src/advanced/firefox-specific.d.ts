/**
 * Firefox-Specific Advanced Types
 * Extends common types with Firefox WebExtension API specifics
 */

// ==================== Firefox Browser Namespace ====================

/**
 * Firefox browser namespace (alias for chrome in Firefox)
 */
export namespace browser {
  const runtime: typeof chrome.runtime;
  const tabs: typeof chrome.tabs;
  const windows: typeof chrome.windows;
  const storage: typeof chrome.storage;
  const scripting: typeof chrome.scripting;
  const action: typeof chrome.action;
  const bookmarks: typeof chrome.bookmarks;
  const contextMenus: typeof chrome.contextMenus;
  const cookies: typeof chrome.cookies;
  const downloads: typeof chrome.downloads;
  const history: typeof chrome.history;
  const notifications: typeof chrome.notifications;
  const webRequest: typeof chrome.webRequest;
  const webNavigation: typeof chrome.webNavigation;
}

// ==================== Firefox-Specific APIs ====================

/**
 * Firefox-only: privacy.network settings
 */
export interface FirefoxPrivacyNetwork {
  /** Configure WebRTC IP handling policy */
  webRTCIPHandlingPolicy: {
    get(): Promise<'default' | 'default_public_and_private_interfaces' | 'default_public_interface_only' | 'disable_non_proxied_udp'>;
    set(details: { value: string }): Promise<void>;
  };
  /** Configure WebRTC multiple routing */
  webRTCMultipleRoutingEnabled: {
    get(): Promise<boolean>;
    set(details: { value: boolean }): Promise<void>;
  };
  /** Configure WebRTC UDP proxy */
  webRTCUDPPProxyType: {
    get(): Promise<'always' | 'proxy_only' | 'default'>;
    set(details: { value: string }): Promise<void>;
  };
}

/**
 * Firefox-only: captive portal detection
 */
export interface CaptivePortal {
  /** Detect if portal is present */
  detectPortal(): Promise<{ status: 'unknown' | 'not_detected' | 'detected' | 'cleared' }>;
  /** Register on portal status change */
  onPortalStatusChanged: {
    addListener(callback: (status: string) => void): void;
    removeListener(callback: (status: string) => void): void;
  };
}

/**
 * Firefox-only: menus (contextMenus with more options)
 */
export interface FirefoxMenus extends chrome.contextMenus.StyleType {
  /** Create context menu with Firefox-specific options */
  create(createProperties: {
    id?: string;
    contexts?: chrome.contextMenus.ContextType[];
    onclick?: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void;
    parentId?: string | number;
    documentUrlPatterns?: string[];
    targetUrlPatterns?: string[];
    enabled?: boolean;
    icons?: Record<string, string>;
    /** Firefox-specific: show relative to image/video */
    relativeToDocument?: boolean;
    /** Firefox-specific: default MIME type for file */
    mimeType?: string;
  }): number | string;
}

/**
 * Firefox-only: sidebar
 */
export interface FirefoxSidebar {
  /** Open sidebar */
  open(url: string): Promise<void>;
  /** Close sidebar */
  close(): Promise<void>;
  /** Check if sidebar is visible */
  isOpen(): Promise<boolean>;
  /** Event when sidebar is toggled */
  onVisibilityChange: {
    addListener(callback: (state: 'visible' | 'hidden') => void): void;
  };
}

/**
 * Firefox-only: theme
 */
export interface FirefoxTheme {
  /** Get current theme */
  getCurrent(windowId?: number): Promise<{
    colors?: {
      accentcolor?: string;
      textcolor?: string;
      toolbar?: string;
      toolbar_text?: string;
      popup?: string;
      popup_text?: string;
      popup_border?: string;
      toolbar_field?: string;
      toolbar_field_text?: string;
    };
    images?: Record<string, string>;
  }>;
  /** Update theme */
  update(windowId: number | 'maximized' | 'normal' | 'fullscreen', theme: {
    colors?: Record<string, string>;
    images?: Record<string, string>;
  }): Promise<void>;
  /** Reset to default */
  reset(windowId?: number): Promise<void>;
  /** Event when theme changes */
  onUpdated: {
    addListener(callback: (updateInfo: { windowId: number; theme: any }) => void): void;
  };
}

/**
 * Firefox-only: experiments API (for WebExtension experiments)
 */
export interface ExperimentsAPI {
  /** Register an experiment */
  register(name: string, schema: string, implementation: any): Promise<void>;
  /** Unregister an experiment */
  unregister(name: string): Promise<void>;
  /** Check if experiment is registered */
  isRegistered(name: string): Promise<boolean>;
}

export {};
