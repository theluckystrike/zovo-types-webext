/**
 * Advanced TypeScript Utilities
 * Provides sophisticated type manipulation for browser extension development
 */

// ==================== Utility Types ====================

/**
 * Makes all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Makes all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Extracts function parameter types as a tuple
 */
export type Parameters<T extends (...args: any[]) => any> = 
  T extends (...args: infer P) => any ? P : never;

/**
 * Extracts return type or Promise-wrapped return type
 */
export type AsyncReturnType<T extends (...args: any[]) => any> = 
  T extends (...args: any[]) => Promise<infer R> ? R : 
  T extends (...args: any[]) => infer R ? R : never;

/**
 * Makes specific properties required while keeping others optional
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Creates a type that excludes null and undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Type-safe event listener registration
 */
export type EventListener<T> = (params: T) => void;

/**
 * Callback-style API to Promise converter options
 */
export type CallbackToPromiseOptions = {
  /** If true, returns Promise; if false, uses callback */
  promise?: boolean;
};

// ==================== Chrome API Utilities ====================

/**
 * Type-safe storage key extractor
 */
export type StorageKey<T> = keyof T;

/**
 * Storage get return type - extracts only requested keys
 */
export type StorageGetResult<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Tab query options - all optional for flexibility
 */
export type TabQueryOptions = {
  active?: boolean;
  currentWindow?: boolean;
  windowId?: number;
  windowType?: 'normal' | 'popup' | 'panel' | 'app';
  index?: number;
  url?: string | string[];
  title?: string;
  favIconUrl?: string;
  pinned?: boolean;
  audible?: boolean;
  muted?: boolean;
  discarded?: boolean;
  autoDiscardable?: boolean;
  groupId?: number;
};

/**
 * Message sender type with strict typing
 */
export type StrictMessageSender = {
  tab?: chrome.tabs.Tab;
  frameId?: number;
  id: string;
  url?: string;
  tlsChannelId?: number;
};

/**
 * Manifest permissions type
 */
export type ManifestPermissions = 
  | 'tabs' 
  | 'storage' 
  | 'cookies' 
  | 'webRequest' 
  | 'webNavigation'
  | 'bookmarks'
  | 'contextMenus'
  | 'geolocation'
  | 'notifications'
  | 'pageCapture'
  | 'tabCapture'
  | 'scripting'
  | 'declarativeContent'
  | 'activeTab'
  | string;

/**
 * Optional manifest permissions
 */
export type OptionalManifestPermissions =
  | 'alarms'
  | 'clipboardRead'
  | 'clipboardWrite'
  | 'contentSettings'
  | 'debugger'
  | 'devtools'
  | 'downloads'
  | 'enterprise.deviceAttributes'
  | 'enterprise.hardwarePlatform'
  | 'enterprise.networkingAttributes'
  | 'enterprise.platformKeys'
  | 'experimental'
  | 'fileBrowserHandler'
  | 'fileSystemProvider'
  | 'gcm'
  | 'identity'
  | 'idle'
  | 'input'
  | 'loginState'
  | 'management'
  | 'nativeMessaging'
  | 'platformKeys'
  | 'power'
  | 'printerProvider'
  | 'printers'
  | 'printing'
  | 'printingMetrics'
  | 'sessions'
  | 'system.cpu'
  | 'system.memory'
  | 'system.storage'
  | 'tts'
  | 'ttsEngine'
  | 'unlimitedStorage'
  | 'vpnProvider'
  | 'wallpaper'
  | 'webRequest.authProvider'
  | string;

// ==================== Event Type Utilities ====================

/**
 * Filter for URL-based events
 */
export type URLEventFilter = {
  urlMatches?: string;
  urlContains?: string;
  urlEquals?: string;
  originAndPathMatches?: string;
  schemes?: string[];
  ports?: number | number[];
  hostSuffix?: string;
  hostContains?: string;
  hostEquals?: string;
  pathContains?: string;
  pathEquals?: string;
  pathPrefix?: string;
  urlFilters?: chrome.events.UrlFilter[];
};

/**
 * Event filter type for tab events
 */
export type TabEventFilter = {
  tabId?: number;
  url?: string | string[];
  title?: string;
};

/**
 * Extension event listener with filtering support
 */
export interface TypedEventListener<T, F = {}> {
  /** Add event listener */
  addListener(callback: (params: T, filter?: F) => void): void;
  /** Remove event listener */
  removeListener(callback: (params: T, filter?: F) => void): void;
  /** Check if has listeners */
  hasListeners(): boolean;
  /** Get registered rules */
  getRules(filter?: chrome.events.Rule[]): Promise<chrome.events.Rule[]>;
  /** Update rules */
  updateRules(addRules?: chrome.events.Rule[], removeRuleIds?: string[]): Promise<void>;
}

// ==================== Script Injection Types ====================

/**
 * Content script injection result
 */
export type InjectionResult<T = unknown> = {
  frameId: number;
  result: T;
  error?: string;
};

/**
 * Script injection options
 */
export type ScriptInjectionOptions = {
  target: {
    tabId: number;
    allFrames?: boolean;
    frameIds?: number[];
  };
  func?: () => unknown;
  files?: string[];
  world?: 'MAIN' | 'ISOLATED';
  injectImmediately?: boolean;
  cssOrigin?: 'AUTHOR' | 'USER';
};

/**
 * CSS injection options
 */
export type CSSInjectionOptions = {
  target: {
    tabId: number;
    allFrames?: boolean;
    frameIds?: number[];
  };
  css?: string;
  files?: string[];
  cssOrigin?: 'AUTHOR' | 'USER';
};

// ==================== Promise Wrappers ====================

/**
 * Callback-style to Promise wrapper
 */
export type CallbackToPromise<T> = T extends (callback: (result: infer R) => void) => void
  ? () => Promise<R>
  : T extends (options: infer O, callback: (result: infer R) => void) => void
  ? (options: O) => Promise<R>
  : never;

/**
 * Creates a Promise-based API from callback API
 */
export type PromisifyAPI<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => void
    ? (...args: A) => Promise<any>
    : T[K];
};

// ==================== Manifest V3 Specific Types ====================

/**
 * Service worker registration
 */
export type ServiceWorkerRegistration = {
  /** ID of the service worker */
  id: string;
  /** When the service worker's script started executing */
  installWorld?: string;
};

/**
 * Action type for MV3
 */
export type MV3Action = {
  setTitle?: { title: string; tabId?: number };
  setIcon?: { iconIndex?: number; imageData?: Record<number, ImageData>; tabId?: number };
  setPopup?: { popup?: string; tabId?: number };
  setBadge?: { text?: string; tabId?: number };
  setBadgeBackgroundColor?: { color?: string; tabId?: number };
};

/**
 * Declarative net request rule
 */
export type DeclarativeNetRequestRule = {
  id: number;
  priority?: number;
  action: {
    type: 'block' | 'allow' | 'redirect' | 'upgradeScheme' | 'modifyHeaders' | 'allowAllRequests';
    redirect?: { url?: string; transform?: { scheme?: string; host?: string; port?: string; path?: string; query?: string } };
    requestHeaders?: { header: string; operation: 'set' | 'append' | 'remove' | 'none' }[];
    responseHeaders?: { header: string; operation: 'set' | 'append' | 'remove' | 'none' }[];
  };
  condition: {
    urlFilter: string;
    resourceTypes?: chrome.webRequest.ResourceType[];
    requestDomains?: string[];
    requestMethods?: string[];
    excludedDomains?: string[];
    excludedRequestDomains?: string[];
    excludedResourceTypes?: chrome.webRequest.ResourceType[];
    isUrlFilterCaseSensitive?: boolean;
  };
};

// ==================== Testing Utilities ====================

/**
 * Mock for chrome.runtime.sendMessage
 */
export type MockSendMessage = {
  /** Returns a promise that resolves with the response */
  resolves?: any;
  /** Returns a promise that rejects with an error */
  rejects?: Error;
  /** Called with these arguments */
  calledWith?: { message?: any; options?: any };
};

/**
 * Test fixture for extension context
 */
export type ExtensionTestFixture = {
  manifest: chrome.runtime.Manifest;
  tabs: chrome.tabs.Tab[];
  storage: Record<string, any>;
  messages: Array<{ from: string; to: string; message: any }>;
};

export {};
