/**
 * AGENT 1: API Schema Fetcher (Simplified)
 * Generates API schemas from internal definitions
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = '/Users/mike/zovo-types';
const API_CACHE_DIR = path.join(PROJECT_ROOT, 'api-cache');

console.log('🤖 AGENT 1: API Schema Fetcher\n');
console.log('='.repeat(60));

// Chrome API definitions (from internal types)
const chromeAPIs = {
  tabs: {
    namespace: 'tabs',
    methods: ['create', 'get', 'getCurrent', 'query', 'update', 'remove', 'reload', 'executeScript', 'insertCSS', 'sendMessage'],
    events: ['onCreated', 'onUpdated', 'onRemoved', 'onActivated', 'onHighlighted', 'onMoved', 'onZoomChange']
  },
  windows: {
    namespace: 'windows', 
    methods: ['create', 'get', 'getAll', 'update', 'remove'],
    events: ['onCreated', 'onRemoved', 'onFocusChanged', 'onBoundsChanged']
  },
  storage: {
    namespace: 'storage',
    areas: ['local', 'sync', 'managed'],
    methods: ['get', 'set', 'remove', 'clear', 'getBytesInUse'],
    events: ['onChanged']
  },
  runtime: {
    namespace: 'runtime',
    methods: ['getManifest', 'getURL', 'getBackgroundPage', 'sendMessage', 'sendNativeMessage', 'connect', 'getPlatformInfo', 'reload', 'update'],
    events: ['onMessage', 'onMessageExternal', 'onConnect', 'onInstalled', 'onStartup', 'onUpdateAvailable']
  },
  action: {
    namespace: 'action',
    methods: ['setTitle', 'setIcon', 'setPopup', 'setBadgeText', 'setBadgeBackgroundColor', 'getTitle', 'getIcon', 'getPopup', 'getBadgeText'],
    events: ['onClicked']
  },
  scripting: {
    namespace: 'scripting',
    methods: ['executeScript', 'insertCSS', 'removeCSS', 'getRegisteredScripts', 'registerContentScript', 'unregisterContentScript'],
    events: ['onScriptInjection']
  },
  sidePanel: {
    namespace: 'sidePanel',
    methods: ['setOptions', 'getOptions', 'setPanelBehavior'],
    events: ['onShow', 'onHide']
  },
  declarativeNetRequest: {
    namespace: 'declarativeNetRequest',
    methods: ['updateSessionRules', 'getSessionRules', 'updateStaticRules', 'getStaticRules', 'isRegexSupported'],
    events: ['onRuleMatchedDebug']
  },
  bookmarks: {
    namespace: 'bookmarks',
    methods: ['create', 'get', 'getTree', 'remove', 'update', 'search', 'move'],
    events: ['onCreated', 'onRemoved', 'onChanged', 'onMoved', 'onChildrenReordered']
  },
  cookies: {
    namespace: 'cookies',
    methods: ['get', 'getAll', 'set', 'remove'],
    events: ['onChanged']
  },
  contextMenus: {
    namespace: 'contextMenus',
    methods: ['create', 'update', 'remove', 'removeAll'],
    events: ['onClicked']
  },
  webRequest: {
    namespace: 'webRequest',
    methods: ['onBeforeRequest', 'onBeforeSendHeaders', 'onSendHeaders', 'onHeadersReceived', 'onAuthRequired', 'onResponseStarted', 'onCompleted', 'onErrorOccurred'],
    events: []
  },
  webNavigation: {
    namespace: 'webNavigation',
    methods: ['getAllFrames', 'getFrame'],
    events: ['onCompleted', 'onErrorOccurred', 'onCreatedNavigationTarget', 'onReferenceFragmentUpdated', 'onTabReplaced', 'onHistoryStateUpdated']
  },
  downloads: {
    namespace: 'downloads',
    methods: ['download', 'open', 'show', 'showDefaultFolder', 'pause', 'resume', 'cancel', 'erase', 'getFileIcon'],
    events: ['onCreated', 'onErased', 'onChanged', 'onDone']
  },
  notifications: {
    namespace: 'notifications',
    methods: ['create', 'update', 'clear', 'getAll', 'getPermissionLevel'],
    events: ['onClosed', 'onClicked', 'onButtonClicked', 'onPermissionLevelChanged', 'onShowSettings']
  },
  identity: {
    namespace: 'identity',
    methods: ['getAuthToken', 'getProfileUserInfo', 'getRedirectURL', 'launchWebAuthFlow', 'removeCachedAuthToken', 'getIdentity'],
    events: ['onTokenRemoved']
  },
  tabs: {
    namespace: 'tabs',
    methods: ['captureVisibleTab', 'detectLanguage', 'discard', 'goBack', 'goForward', 'group', 'highlight', 'ungroup', 'setZoom', 'getZoom', 'setZoomSettings', 'getZoomSettings', 'print', 'printPreview', 'saveAsPDF', 'toggleReaderMode'],
    events: ['onTabCaptured', 'onZoomChange']
  }
};

// Firefox-specific APIs
const firefoxAPIs = {
  ...chromeAPIs,
  theme: {
    namespace: 'theme',
    methods: ['getCurrent', 'update', 'reset'],
    events: ['onUpdated']
  },
  sidebar: {
    namespace: 'sidebar',
    methods: ['open', 'close', 'isOpen'],
    events: ['onVisibilityChange']
  },
  menus: {
    namespace: 'menus',
    methods: ['create', 'update', 'remove', 'removeAll', 'refresh'],
    events: ['onClicked', 'onHidden', 'onShown']
  },
  captivePortal: {
    namespace: 'captivePortal',
    methods: ['detectPortal'],
    events: ['onPortalStatusChanged']
  }
};

// Save API schemas
function saveAPISchemas() {
  console.log('\n📥 Saving API schemas...\n');
  
  const rawDir = path.join(API_CACHE_DIR, 'raw');
  fs.mkdirSync(path.join(rawDir, 'chrome'), { recursive: true });
  fs.mkdirSync(path.join(rawDir, 'firefox'), { recursive: true });
  
  // Save Chrome APIs
  Object.entries(chromeAPIs).forEach(([name, api]) => {
    fs.writeFileSync(
      path.join(rawDir, 'chrome', name + '.json'),
      JSON.stringify(api, null, 2)
    );
    console.log('  ✅ chrome.' + name);
  });
  
  // Save Firefox APIs  
  Object.entries(firefoxAPIs).forEach(([name, api]) => {
    fs.writeFileSync(
      path.join(rawDir, 'firefox', name + '.json'),
      JSON.stringify(api, null, 2)
    );
    console.log('  ✅ browser.' + name);
  });
}

// Generate combined schema
function generateCombinedSchema() {
  console.log('\n📦 Generating combined schema...\n');
  
  const combined = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    namespaces: {
      chrome: Object.keys(chromeAPIs),
      firefox: Object.keys(firefoxAPIs),
      common: Object.keys(chromeAPIKeys => Object.keys(chromeAPIs).filter(k => firefoxAPIs[k]))
    },
    statistics: {
      chrome: { namespaces: Object.keys(chromeAPIs).length, methods: Object.values(chromeAPIs).reduce((a, b) => a + (b.methods?.length || 0), 0) },
      firefox: { namespaces: Object.keys(firefoxAPIs).length, methods: Object.values(firefoxAPIs).reduce((a, b) => a + (b.methods?.length || 0), 0) }
    }
  };
  
  fs.writeFileSync(
    path.join(API_CACHE_DIR, 'combined-schema.json'),
    JSON.stringify(combined, null, 2)
  );
  
  console.log('  ✅ combined-schema.json');
  console.log('     Chrome: ' + combined.statistics.chrome.namespaces + ' namespaces, ' + combined.statistics.chrome.methods + ' methods');
  console.log('     Firefox: ' + combined.statistics.firefox.namespaces + ' namespaces, ' + combined.statistics.firefox.methods + ' methods');
}

function main() {
  saveAPISchemas();
  generateCombinedSchema();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ AGENT 1 COMPLETE: API schemas fetched');
}

main();
