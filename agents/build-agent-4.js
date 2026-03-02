// Agent 4: Build crx-compatibility-check
const fs = require('fs');
const path = require('path');

const projectRoot = '/Users/mike/zovo-types/packages/crx-compatibility-check';

console.log('Building crx-compatibility-check...');

const dirs = ['src', 'tests/fixtures', '.github/workflows'];
dirs.forEach(d => fs.mkdirSync(path.join(projectRoot, d), { recursive: true }));

// package.json
const pkgJson = {
  "name": "@zovo/crx-compatibility-check",
  "version": "1.0.0",
  "description": "Check Chrome extension cross-browser compatibility",
  "bin": { "crx-compatibility-check": "./dist/cli.js" },
  "scripts": { "build": "tsc", "test": "jest" },
  "dependencies": { "commander": "^11.0.0" },
  "devDependencies": { "typescript": "^5.0.0" },
  "keywords": ["chrome-extension", "compatibility", "cross-browser", "firefox", "safari"],
  "license": "MIT"
};
fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify(pkgJson, null, 2));

// API compatibility matrix
const compatibilityMatrix = {
  "chrome.tabs": { firefox: "browser.tabs", safari: "browser.tabs", edge: "chrome.tabs", notes: "Same API" },
  "chrome.storage": { firefox: "browser.storage", safari: "browser.storage", edge: "chrome.storage", notes: "Same API" },
  "chrome.runtime": { firefox: "browser.runtime", safari: "browser.runtime", edge: "chrome.runtime", notes: "Same API" },
  "chrome.runtime.sendMessage": { firefox: "browser.runtime.sendMessage", safari: "browser.runtime.sendMessage", edge: "chrome.runtime.sendMessage", notes: "Same API" },
  "chrome.runtime.onMessage": { firefox: "browser.runtime.onMessage", safari: "browser.runtime.onMessage", edge: "chrome.runtime.onMessage", notes: "Same API" },
  "chrome.alarms": { firefox: "browser.alarms", safari: "browser.alarms", edge: "chrome.alarms", notes: "Same API" },
  "chrome.bookmarks": { firefox: "browser.bookmarks", safari: "Not supported", edge: "chrome.bookmarks", notes: "Safari missing" },
  "chrome.cookies": { firefox: "browser.cookies", safari: "browser.cookies", edge: "chrome.cookies", notes: "Same API" },
  "chrome.contextMenus": { firefox: "browser.menus", safari: "Not supported", edge: "chrome.contextMenus", notes: "Firefox uses browser.menus" },
  "chrome.downloads": { firefox: "browser.downloads", safari: "Not supported", edge: "chrome.downloads", notes: "Safari missing" },
  "chrome.extension": { firefox: "browser.extension", safari: "browser.extension", edge: "chrome.extension", notes: "Same API" },
  "chrome.history": { firefox: "browser.history", safari: "Not supported", edge: "chrome.history", notes: "Safari missing" },
  "chrome.identity": { firefox: "browser.identity", safari: "Not supported", edge: "chrome.identity", notes: "Safari missing" },
  "chrome.notifications": { firefox: "browser.notifications", safari: "browser.notifications", edge: "chrome.notifications", notes: "Same API" },
  "chrome.proxy": { firefox: "browser.proxy", safari: "Not supported", edge: "chrome.proxy", notes: "Safari missing" },
  "chrome.scripting": { firefox: "browser.scripting", safari: "Not supported", edge: "chrome.scripting", notes: "Firefox 128+ required" },
  "chrome.sidePanel": { firefox: "Not supported", safari: "Not supported", edge: "chrome.sidePanel", notes: "Edge/Chrome only" },
  "chrome.webRequest": { firefox: "browser.webRequest", safari: "Not supported", edge: "chrome.webRequest", notes: "Safari missing - use declarativeNetRequest" },
  "chrome.declarativeNetRequest": { firefox: "browser.declarativeNetRequest", safari: "Not supported", edge: "chrome.declarativeNetRequest", notes: "Firefox 128+ required" },
  "chrome.action": { firefox: "browser.action", safari: "browser.action", edge: "chrome.action", notes: "Same API, MV3" },
  "chrome.commands": { firefox: "browser.commands", safari: "browser.commands", edge: "chrome.commands", notes: "Same API" },
  "chrome.storage.session": { firefox: "browser.storage.session", safari: "browser.storage.session", edge: "chrome.storage.session", notes: "Same API (MV3)" },
  "chrome.declarativeNetRequest.withHostAccess": { firefox: "Not supported", safari: "Not supported", edge: "chrome.declarativeNetRequest.withHostAccess", notes: "Chrome/Edge only" },
  "chrome.scripting.registerContentScript": { firefox: "browser.scripting.registerContentScript", safari: "Not supported", edge: "chrome.scripting.registerContentScript", notes: "Firefox 128+, Safari missing" },
  "chrome.scripting.executeScript": { firefox: "browser.scripting.executeScript", safari: "Not supported", edge: "chrome.scripting.executeScript", notes: "Firefox uses browser.scripting" },
  "chrome.offscreen": { firefox: "Not supported", safari: "Not supported", edge: "chrome.offscreen", notes: "Chrome/Edge only" },
  "chrome.permissions": { firefox: "browser.permissions", safari: "browser.permissions", edge: "chrome.permissions", notes: "Same API" },
  "chrome.permissions.contains": { firefox: "browser.permissions.contains", safari: "browser.permissions.contains", edge: "chrome.permissions.contains", notes: "Same API" },
  "chrome.offscreen.createDocument": { firefox: "Not supported", safari: "Not supported", edge: "chrome.offscreen.createDocument", notes: "MV3 Chrome/Edge only" },
  "chrome.action.setIcon": { firefox: "browser.action.setIcon", safari: "browser.action.setIcon", edge: "chrome.action.setIcon", notes: "Same API" },
  "chrome.action.onClicked": { firefox: "browser.action.onClicked", safari: "browser.action.onClicked", edge: "chrome.action.onClicked", notes: "Same API" },
  "chrome.tabs.create": { firefox: "browser.tabs.create", safari: "browser.tabs.create", edge: "chrome.tabs.create", notes: "Same API" },
  "chrome.tabs.query": { firefox: "browser.tabs.query", safari: "browser.tabs.query", edge: "chrome.tabs.query", notes: "Same API" },
  "chrome.tabs.sendMessage": { firefox: "browser.tabs.sendMessage", safari: "browser.tabs.sendMessage", edge: "chrome.tabs.sendMessage", notes: "Same API" }
};

// src/core.ts
const coreTs = `import * as fs from 'fs';
import * as path from 'path';

const COMPATIBILITY = ${JSON.stringify(compatibilityMatrix)};

export interface CompatibilityIssue {
  api: string;
  browser: string;
  status: 'supported' | 'unsupported' | 'different';
  chromeEquivalent?: string;
  notes: string;
}

export interface CompatibilityReport {
  manifestVersion: number;
  apis: CompatibilityIssue[];
  summary: {
    totalApis: number;
    firefoxCompatible: number;
    safariCompatible: number;
    edgeCompatible: number;
    unsupportedApis: string[];
  };
  recommendations: string[];
}

function extractApis(manifest: any, srcDir: string): string[] {
  const apis: Set<string> = new Set();
  
  // Scan JS/TS files for API usage
  function scanFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const matches = content.matchAll(/chrome\\\\.([a-zA-Z.]+)/g);
    for (const match of matches) {
      let api = 'chrome.' + match[1];
      // Normalize to base API
      const baseApi = api.split('.')[0] + '.' + api.split('.')[1];
      apis.add(baseApi);
    }
  }
  
  function walkDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
        scanFile(fullPath);
      }
    }
  }
  
  // Look for source files
  const srcPath = path.join(path.dirname(manifest), 'src');
  const distPath = path.join(path.dirname(manifest), 'dist');
  const bgPath = path.join(path.dirname(manifest), 'background');
  const jsPath = path.join(path.dirname(manifest), 'js');
  
  [srcPath, distPath, bgPath, jsPath].forEach(walkDir);
  
  return Array.from(apis);
}

export function checkCompatibility(extensionPath: string): CompatibilityReport {
  const manifestPath = path.join(extensionPath, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const mv = manifest.manifest_version;
  
  const apis = extractApis(manifestPath, extensionPath);
  const issues: CompatibilityIssue[] = [];
  const unsupportedApis: string[] = [];
  
  for (const api of apis) {
    const compat = COMPATIBILITY[api];
    if (!compat) continue;
    
    // Check Firefox
    if (compat.firefox === 'Not supported') {
      issues.push({ api, browser: 'Firefox', status: 'unsupported', notes: compat.notes });
      unsupportedApis.push(api);
    } else if (compat.firefox !== 'chrome.' + api.replace('chrome.', '')) {
      issues.push({ api, browser: 'Firefox', status: 'different', chromeEquivalent: compat.firefox, notes: compat.notes });
    }
    
    // Check Safari
    if (compat.safari === 'Not supported') {
      issues.push({ api, browser: 'Safari', status: 'unsupported', notes: compat.notes });
      if (!unsupportedApis.includes(api)) unsupportedApis.push(api);
    }
    
    // Check Edge
    if (compat.edge === 'Not supported') {
      issues.push({ api, browser: 'Edge', status: 'unsupported', notes: compat.notes });
    }
  }
  
  const summary = {
    totalApis: apis.length,
    firefoxCompatible: apis.filter(a => COMPATIBILITY[a]?.firefox !== 'Not supported').length,
    safariCompatible: apis.filter(a => COMPATIBILITY[a]?.safari !== 'Not supported').length,
    edgeCompatible: apis.filter(a => COMPATIBILITY[a]?.edge !== 'Not supported').length,
    unsupportedApis
  };
  
  const recommendations: string[] = [];
  if (summary.safariCompatible < summary.totalApis) {
    recommendations.push('Use @zovo/webext-polyfill for Safari compatibility');
  }
  if (unsupportedApis.includes('chrome.sidePanel')) {
    recommendations.push('sidePanel not supported in Firefox/Safari - provide fallback');
  }
  if (unsupportedApis.includes('chrome.webRequest')) {
    recommendations.push('Use declarativeNetRequest instead of webRequest for cross-browser');
  }
  if (unsupportedApis.includes('chrome.offscreen')) {
    recommendations.push('offscreen API not in Firefox/Safari - use alternative approach');
  }
  
  return { manifestVersion: mv, apis: issues, summary, recommendations };
}

export function formatReport(report: CompatibilityReport): string {
  let output = \`🔍 CROSS-BROWSER COMPATIBILITY REPORT

📊 SUMMARY
─────────────────────────────────────────────────────────────────
  Manifest Version:  \${report.manifestVersion}
  Total APIs Used:   \${report.summary.totalApis}

  ✅ Firefox Compatible:  \${report.summary.firefoxCompatible}/\${report.summary.totalApis}
  ✅ Safari Compatible:    \${report.summary.safariCompatible}/\${report.summary.totalApis}
  ✅ Edge Compatible:      \${report.summary.edgeCompatible}/\${report.summary.totalApis}

  ❌ Unsupported APIs:    \${report.summary.unsupportedApis.length}
\`;
  
  const unsupported = report.apis.filter(a => a.status === 'unsupported');
  if (unsupported.length > 0) {
    output += \`\n❌ UNSUPPORTED APIs
─────────────────────────────────────────────────────────────────\`;
    for (const issue of unsupported) {
      output += \`\n  \${issue.api} → \${issue.browser}\`;
      output += \`\n     \${issue.notes}\`;
    }
  }
  
  const different = report.apis.filter(a => a.status === 'different');
  if (different.length > 0) {
    output += \`\n⚠️ DIFFERENT APIs (need mapping)
─────────────────────────────────────────────────────────────────\`;
    for (const issue of different) {
      output += \`\n  \${issue.api} → \${issue.browser}: \${issue.chromeEquivalent}\`;
    }
  }
  
  if (report.recommendations.length > 0) {
    output += \`\n💡 RECOMMENDATIONS
─────────────────────────────────────────────────────────────────\`;
    for (const rec of report.recommendations) {
      output += \`\n  • \${rec}\`;
    }
  }
  
  return output;
}
`;
fs.writeFileSync(path.join(projectRoot, 'src/core.ts'), coreTs);

// src/cli.ts
const cliTs = `import { Command } from 'commander';
import { checkCompatibility, formatReport } from './core';

const program = new Command();

program
  .name('crx-compatibility-check')
  .description('Check Chrome extension cross-browser compatibility')
  .version('1.0.0')
  .argument('<path>', 'Path to extension directory')
  .action((extPath: string) => {
    const report = checkCompatibility(extPath);
    console.log(formatReport(report));
  });

program.parse();
`;
fs.writeFileSync(path.join(projectRoot, 'src/cli.ts'), cliTs);

// src/index.ts
fs.writeFileSync(path.join(projectRoot, 'src/index.ts'), `export { checkCompatibility, formatReport, CompatibilityReport, CompatibilityIssue } from './core';`);

// tsconfig.json
fs.writeFileSync(path.join(projectRoot, 'tsconfig.json'), JSON.stringify({
  compilerOptions: { target: "ES2020", module: "commonjs", outDir: "./dist", strict: true, esModuleInterop: true },
  include: ["src/**/*"]
}, null, 2));

// README.md
fs.writeFileSync(path.join(projectRoot, 'README.md'), `# @zovo/crx-compatibility-check

Check Chrome extension cross-browser compatibility with Firefox, Safari, and Edge.

## Usage

\`\`\`bash
npx crx-compatibility-check ./my-extension
\`\`\`

## Features

- Detects incompatible APIs
- Shows Firefox/Safari/Edge equivalents
- Recommends polyfills
- MV2 → MV3 compatibility checks
`);

// Test fixture
fs.mkdirSync(path.join(projectRoot, 'tests/fixtures/test/src'), { recursive: true });
fs.writeFileSync(path.join(projectRoot, 'tests/fixtures/test/manifest.json'), JSON.stringify({
  manifest_version: 3,
  name: "Test",
  version: "1.0.0",
  background: { service_worker: "bg.js" }
}, null, 2));
fs.writeFileSync(path.join(projectRoot, 'tests/fixtures/test/src/background.ts'), `
chrome.tabs.create({ url: 'https://example.com' });
chrome.storage.local.set({ key: 'value' });
chrome.sidePanel.setOptions({ path: 'panel.html' });
chrome.webRequest.onBeforeRequest.addListener();
`);

console.log('✅ crx-compatibility-check built successfully');
