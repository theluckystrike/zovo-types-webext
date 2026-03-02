/**
 * @zovo/types-monorepo - VS Code IntelliSense Improvements
 * Generates enhancements for better VS Code support than @types/chrome
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

/**
 * Generate VS Code improvements
 */
function generateVSCodeImprovements() {
  console.log('💻 Generating VS Code IntelliSense Improvements\n');
  console.log('═'.repeat(50));

  const improvements = {
    metadata: {
      generated: new Date().toISOString(),
      description: 'VS Code IntelliSense enhancements for WebExtension development'
    },
    improvements: [
      {
        name: 'Better Promise-based API Support',
        description: 'Native Promise return types instead of requiring callbacks',
        before: 'chrome.tabs.query({}, (tabs) => {})',
        after: 'const tabs = await chrome.tabs.query({})',
        files: ['chrome.tabs.d.ts', 'chrome.windows.d.ts', 'chrome.bookmarks.d.ts']
      },
      {
        name: 'Typed Message Payloads',
        description: 'Type-safe message passing between content scripts and background',
        before: 'chrome.runtime.sendMessage({ type: "ping" }) // any',
        after: '// Typed message union for all message types',
        files: ['chrome.runtime.d.ts']
      },
      {
        name: 'Manifest Type Checking',
        description: 'Full manifest.json schema validation at compile time',
        before: 'manifest.json has no type checking',
        after: 'manifest: chrome.runtime.ManifestV3 // fully typed',
        files: ['chrome.runtime.d.ts', 'manifest.d.ts']
      },
      {
        name: 'Event Listener Typing',
        description: 'Strongly typed event listeners with proper parameter inference',
        before: 'chrome.tabs.onUpdated.addListener((tab) => {}) // loose typing',
        after: 'chrome.tabs.onUpdated.addListener((tab, changeInfo, tab) => {}) // full inference',
        files: ['chrome.events.d.ts']
      },
      {
        name: 'Cross-browser Polyfill Hints',
        description: 'IDE suggestions for browser-specific APIs and fallbacks',
        before: 'No hints for cross-browser compatibility',
        after: '// @TODO: Use browser polyfill for Safari support',
        files: ['types-webext-common.d.ts']
      },
      {
        name: 'Callback-free Async APIs',
        description: 'Modern async/await compatible API surface',
        before: 'chrome.storage.local.get("key", callback)',
        after: 'const value = await chrome.storage.local.get("key")',
        files: ['chrome.storage.d.ts', 'chrome.cookies.d.ts', 'chrome.history.d.ts']
      },
      {
        name: 'Strict Permission Checking',
        description: 'Type errors when using APIs without required permissions',
        before: 'chrome.cookies.get({}) // no error without permission',
        after: '// Error: "cookies" permission required',
        files: ['manifest.d.ts']
      },
      {
        name: 'Tab/Window Context Types',
        description: 'Differentiate between popup, background, and content script contexts',
        before: 'Same chrome API available everywhere',
        after: 'chrome.runtime only in bg, chrome.tabs only with permission',
        files: ['global.d.ts']
      }
    ],
    snippets: generateSnippets(),
    settings: generateVSCodeSettings(),
    extensions: generateRecommendedExtensions()
  };

  // Save improvements
  const improvementsPath = path.join(ROOT_DIR, 'vscode-improvements.json');
  fs.writeFileSync(improvementsPath, JSON.stringify(improvements, null, 2));

  // Generate VS Code settings file
  const settingsPath = path.join(ROOT_DIR, '.vscode', 'settings.json');
  const vscodeDir = path.dirname(settingsPath);
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir, { recursive: true });
  }
  fs.writeFileSync(settingsPath, JSON.stringify(improvements.settings, null, 2));

  // Generate extension recommendations
  const extensionsPath = path.join(ROOT_DIR, '.vscode', 'extensions.json');
  fs.writeFileSync(extensionsPath, JSON.stringify(improvements.extensions, null, 2));

  // Generate code snippets
  const snippetsPath = path.join(vscodeDir, 'webext.code-snippets');
  fs.writeFileSync(snippetsPath, JSON.stringify(improvements.snippets, null, 2));

  console.log('\n' + '═'.repeat(50));
  console.log('✅ VS Code IntelliSense Improvements Generated');
  console.log(`   ${improvements.improvements.length} improvements`);
  console.log(`   ${Object.keys(improvements.snippets).length} snippets`);
  console.log('   Saved to:');
  console.log('   - vscode-improvements.json');
  console.log('   - .vscode/settings.json');
  console.log('   - .vscode/extensions.json');
  console.log('   - .vscode/webext.code-snippets');
  console.log('═'.repeat(50));

  return improvements;
}

function generateSnippets() {
  return {
    "chrome-tabs-query": {
      "prefix": "chrome-tabs-query",
      "body": [
        "const tabs = await chrome.tabs.query({",
        "  $1active: true,",
        "  $2currentWindow: true",
        "});",
        "$0"
      ],
      "description": "Query tabs with async/await"
    },
    "chrome-storage-get": {
      "prefix": "chrome-storage-get",
      "body": [
        "const result = await chrome.storage.local.get([\"$1key\"]);",
        "const value = result.$1key;",
        "$0"
      ],
      "description": "Get from storage with async/await"
    },
    "chrome-storage-set": {
      "prefix": "chrome-storage-set",
      "body": [
        "await chrome.storage.local.set({",
        "  $1key: $2value",
        "});",
        "$0"
      ],
      "description": "Set storage with async/await"
    },
    "chrome-message-background": {
      "prefix": "chrome-message-bg",
      "body": [
        "chrome.runtime.onMessage.addListener(",
        "  (message, sender, sendResponse) => {",
        "    switch (message.type) {",
        "      case '$1ping':",
        "        sendResponse({ type: 'pong' });",
        "        break;",
        "    }",
        "  }",
        ");",
        "$0"
      ],
      "description": "Background script message listener"
    },
    "chrome-message-content": {
      "prefix": "chrome-message-content",
      "body": [
        "const response = await chrome.runtime.sendMessage({",
        "  type: '$1ping',",
        "  payload: $2",
        "});",
        "$0"
      ],
      "description": "Send message from content script"
    },
    "chrome-context-menu": {
      "prefix": "chrome-context-menu",
      "body": [
        "chrome.contextMenus.create({",
        "  id: '$1my-menu',",
        "  title: '$2My Menu',",
        "  contexts: ['page', 'selection']",
        "});",
        "",
        "chrome.contextMenus.onClicked.addListener((info, tab) => {",
        "  if (info.menuItemId === '$1my-menu') {",
        "    $0",
        "  }",
        "});",
        "$0"
      ],
      "description": "Create context menu"
    },
    "chrome-alarm": {
      "prefix": "chrome-alarm",
      "body": [
        "chrome.alarms.create('$1my-alarm', {",
        "  delayInMinutes: $2,",
        "  periodInMinutes: $3",
        "});",
        "",
        "chrome.alarms.onAlarm.addListener((alarm) => {",
        "  if (alarm.name === '$1my-alarm') {",
        "    $0",
        "  }",
        "});",
        "$0"
      ],
      "description": "Create alarm with listener"
    },
    "chrome-tabs-create": {
      "prefix": "chrome-tabs-create",
      "body": [
        "const tab = await chrome.tabs.create({",
        "  url: '$1https://example.com',",
        "  active: true",
        "});",
        "$0"
      ],
      "description": "Create new tab"
    }
  };
}

function generateVSCodeSettings() {
  return {
    "typescript.tsdk": "node_modules/typescript/lib",
    "typescript.preferences.includePackageJsonAutoImports": "on",
    "typescript.suggest.autoImports": true,
    "javascript.suggest.autoImports": true,
    "[typescript]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "editor.formatOnSave": true
    },
    "[json]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit"
    },
    "typescript.updateImportsOnFileMove.enabled": "always",
    "typescript.suggest.paths": true,
    "typescript.suggestions": {
      "autoImports": true,
      "classMemberSuggestions": true,
      "objectMembers": true
    }
  };
}

function generateRecommendedExtensions() {
  return {
    "recommendations": [
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "ms-vscode.vscode-typescript-next",
      "christian-kohler.path-intellisense",
      "visualstudioexptteam.vscodeintellicode"
    ]
  };
}

if (require.main === module) {
  generateVSCodeImprovements();
}

module.exports = { generateVSCodeImprovements };
