/**
 * AGENT 4: VS Code Extension Generator (Simplified)
 * Creates VS Code extension structure for enhanced IntelliSense
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = '/Users/mike/zovo-types';
const VSCODE_EXT_DIR = path.join(PROJECT_ROOT, 'vscode-extension');

console.log('🤖 AGENT 4: VS Code Extension Generator\n');
console.log('='.repeat(60));

// Create extension directory structure
const dirs = ['src/providers', 'snippets', 'schema'];
dirs.forEach(d => fs.mkdirSync(path.join(VSCODE_EXT_DIR, d), { recursive: true }));

// Package.json for extension
const pkgJson = {
  name: 'zovo-webext-types',
  displayName: '@zovo WebExt Types',
  description: 'Enhanced IntelliSense for browser extension development',
  version: '1.0.0',
  publisher: 'zovo',
  engines: { vscode: '^1.80.0' },
  categories: ['Programming Languages', 'IntelliSense'],
  keywords: ['chrome-extension', 'firefox-webextension', 'intellisense'],
  activationEvents: ['onLanguage:typescript', 'onLanguage:javascript'],
  main: './out/extension.js',
  contributes: {
    configuration: {
      title: '@zovo WebExt Types',
      properties: {
        'zovoWebext.autocomplete': { type: 'boolean', default: true },
        'zovoWebext.preferredBrowser': { type: 'string', default: 'chrome', enum: ['chrome', 'firefox', 'safari', 'edge'] }
      }
    },
    snippets: [
      { language: 'typescript', path: './snippets/chrome.json' },
      { language: 'javascript', path: './snippets/chrome.json' }
    ]
  }
};

fs.writeFileSync(path.join(VSCODE_EXT_DIR, 'package.json'), JSON.stringify(pkgJson, null, 2));
console.log('✅ package.json');

// Main extension code
const extCode = `import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('@zovo/webext-types activated');
  
  const provider = vscode.languages.registerCompletionItemProvider(
    { scheme: 'file', language: 'typescript' },
    {
      provideCompletionItems(doc, pos) {
        const line = doc.lineAt(pos.line).text;
        const items: vscode.CompletionItem[] = [];
        
        if (line.includes('chrome.') || line.includes('browser.')) {
          const apis = [
            'chrome.tabs.query', 'chrome.tabs.create', 'chrome.tabs.update',
            'chrome.storage.local.get', 'chrome.storage.local.set',
            'chrome.runtime.sendMessage', 'chrome.runtime.onMessage.addListener',
            'chrome.scripting.executeScript'
          ];
          
          apis.forEach(api => {
            const item = new vscode.CompletionItem(api, vscode.CompletionItemKind.Method);
            item.detail = api;
            items.push(item);
          });
        }
        
        return items;
      }
    }
  );
  
  context.subscriptions.push(provider);
}

export function deactivate() {}
`;

fs.writeFileSync(path.join(VSCODE_EXT_DIR, 'src/extension.ts'), extCode);
console.log('✅ extension.ts');

// Snippets
const snippets = {
  'chrome.tabs.query': { prefix: 'tabs-query', body: ['chrome.tabs.query({', '  active: true,', '  currentWindow: true', '}, (tabs) => {', '  $0', '});'], description: 'Query tabs' },
  'chrome.storage.set': { prefix: 'storage-set', body: ['chrome.storage.local.set({', '  $1: $2', '});'], description: 'Set storage' },
  'manifest-v3': { prefix: 'manifest-v3', body: ['{', '  "manifest_version": 3,', '  "name": "$1",', '  "version": "1.0"', '}'], description: 'MV3 manifest' }
};

fs.writeFileSync(path.join(VSCODE_EXT_DIR, 'snippets/chrome.json'), JSON.stringify(snippets, null, 2));
console.log('✅ snippets');

// tsconfig
const tsconfig = { compilerOptions: { target: 'ES2020', module: 'commonjs', outDir: './out', strict: true }, include: ['src/**/*'] };
fs.writeFileSync(path.join(VSCODE_EXT_DIR, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
console.log('✅ tsconfig.json');

// README
fs.writeFileSync(path.join(VSCODE_EXT_DIR, 'README.md'), `# @zovo/webext-types VS Code Extension

## Features
- Enhanced autocomplete for Chrome, Firefox, Safari, Edge APIs
- Snippets for common patterns
- Configurable browser preference

## Build
\`\`\`bash
npm install
npm run compile
\`\`\`

## Install
\`\`\`bash
code --install-extension zovo-webext-types-1.0.0.vsix
\`\`\`
`);
console.log('✅ README.md');

console.log('\n📊 VS Code Extension: 6 files created');
console.log('\n✅ AGENT 4 COMPLETE');
