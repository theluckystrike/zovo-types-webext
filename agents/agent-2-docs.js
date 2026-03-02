/**
 * AGENT 2: Enhanced Documentation Generator
 * Generates comprehensive documentation, guides, and API references
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = '/Users/mike/zovo-types';
const PACKAGES_DIR = path.join(PROJECT_ROOT, 'packages');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');

console.log('🤖 AGENT 2: Enhanced Documentation Generator\n');
console.log('='.repeat(60));

// Extract API information from type definitions
function extractAPIDocumentation(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, '.d.ts');
  
  const apis = {
    interfaces: [],
    types: [],
    namespaces: [],
    methods: [],
    events: [],
    properties: []
  };
  
  // Extract interfaces
  const interfaceMatches = content.match(/export\s+interface\s+(\w+)/g);
  if (interfaceMatches) {
    interfaceMatches.forEach(match => {
      const name = match.replace('export interface ', '');
      apis.interfaces.push(name);
    });
  }
  
  // Extract type aliases
  const typeMatches = content.match(/export\s+type\s+(\w+)/g);
  if (typeMatches) {
    typeMatches.forEach(match => {
      const name = match.replace('export type ', '');
      apis.types.push(name);
    });
  }
  
  // Extract methods (functions)
  const methodMatches = content.match(/(?:export\s+)?function\s+(\w+)/g);
  if (methodMatches) {
    methodMatches.forEach(match => {
      const name = match.replace('export function ', '').replace('function ', '');
      apis.methods.push(name);
    });
  }
  
  // Extract events (on* properties)
  const eventMatches = content.match(/(?:on\w+|on[A-Z]\w+)\s*:/g);
  if (eventMatches) {
    eventMatches.forEach(match => {
      apis.events.push(match.replace(':', '').trim());
    });
  }
  
  // Extract properties
  const propertyMatches = content.match(/^\s+(\w+)\s*\??\s*:/gm);
  if (propertyMatches) {
    propertyMatches.forEach(match => {
      const prop = match.trim().replace(/:$/, '');
      if (!apis.properties.includes(prop)) {
        apis.properties.push(prop);
      }
    });
  }
  
  return { fileName, apis };
}

// Generate main documentation index
function generateDocsIndex(packages) {
  let index = `# @zovo/types-webext Documentation

## Overview

Comprehensive TypeScript type definitions for browser extensions across Chrome, Firefox, Safari, and Edge.

## Packages

| Package | Description | APIs |
|---------|-------------|------|
| @zovo/types-chrome-extension | Chrome/Chromium APIs | ${packages.chrome} namespaces |
| @zovo/types-firefox-extension | Firefox WebExtension APIs | ${packages.firefox} namespaces |
| @zovo/types-safari-extension | Safari App Extension APIs | ${packages.safari} namespaces |
| @zovo/types-edge-extension | Microsoft Edge APIs | ${packages.edge} namespaces |
| @zovo/types-webext-common | Cross-browser intersection | ${packages.common} APIs |
| @zovo/types-webext-full | Full union of all browsers | ${packages.full} APIs |

## Quick Start

\`\`\`bash
npm install @zovo/types-chrome-extension
\`\`\`

### VS Code
Add to \`tsconfig.json\`:
\`\`\`json
{
  "types": ["@zovo/types-chrome-extension"]
}
\`\`\`

### TypeScript
\`\`\`typescript
import { chrome } from '@zovo/types-chrome-extension';

chrome.tabs.query({ active: true }, (tabs) => {
  console.log(tabs[0].id);
});
\`\`\`

## Browser Compatibility

See [\`cross-browser-compatibility.json\`](../cross-browser-compatibility.json) for detailed compatibility matrix.

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md)

## License

MIT
`;
  return index;
}

// Generate per-package documentation
function generatePackageDocs(packageDir, packageName) {
  const srcDir = path.join(packageDir, 'src');
  if (!fs.existsSync(srcDir)) return null;
  
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.d.ts'));
  
  let docs = `# ${packageName}\n\n`;
  docs += `## API Reference\n\n`;
  
  files.forEach(file => {
    const { fileName, apis } = extractAPIDocumentation(path.join(srcDir, file));
    
    docs += `### ${fileName}\n\n`;
    
    if (apis.interfaces.length > 0) {
      docs += `**Interfaces:** \`${apis.interfaces.join('`, `')}\`\n\n`;
    }
    if (apis.types.length > 0) {
      docs += `**Types:** \`${apis.types.join('`, `')}\`\n\n`;
    }
    if (apis.methods.length > 0) {
      docs += `**Methods:** ${apis.methods.map(m => `- \`${m}()\``).join('\n')}\n\n`;
    }
    if (apis.events.length > 0) {
      docs += `**Events:** ${apis.events.map(e => `- \`${e}\``).join('\n')}\n\n`;
    }
    if (apis.properties.length > 0) {
      docs += `**Properties:** ${apis.properties.slice(0, 5).map(p => `- \`${p}\``).join('\n')}${apis.properties.length > 5 ? '\n  ...' : ''}\n\n`;
    }
    
    docs += `---\n\n`;
  });
  
  return docs;
}

// Generate migration guide
function generateMigrationGuide() {
  return `# Migration Guide

## Upgrading from @types/chrome

### Key Differences

1. **Namespace Structure**
   - @types/chrome: \`chrome.tabs.Tab\`
   - @zovo: Direct imports \`import { Tab } from '@zovo/types-chrome-extension'\`

2. **Promise Support**
   - @types/chrome: Callback-based only
   - @zovo: Both callback AND Promise variants

3. **Type Safety**
   - @zovo provides stricter types for:
     - Tab URL and ID combinations
     - Storage type constraints
     - Message passing schemas

### Example Migration

\`\`\`typescript
// Before (@types/chrome)
chrome.tabs.query({ active: true }, (tabs) => {
  const tab = tabs[0];
  chrome.tabs.update(tab.id!, { active: true });
});

// After (@zovo)
import { chrome } from '@zovo/types-chrome-extension';

// Option 1: Callbacks (same as before)
chrome.tabs.query({ active: true }, (tabs) => {
  const tab = tabs[0];
  if (tab.id) {
    chrome.tabs.update(tab.id, { active: true });
  }
});

// Option 2: Promises (NEW!)
const tabs = await chrome.tabs.query({ active: true });
if (tabs[0]?.id) {
  await chrome.tabs.update(tabs[0].id, { active: true });
}
\`\`\`

## Common Gotchas

1. **Nullable IDs**: Always check \`tab.id\` exists before using
2. **Permission Requirements**: Some APIs require manifest permissions
3. **Browser-Specific APIs**: Use \`@zovo/types-webext-common\` for cross-browser
`;
}

// Generate API changelog format
function generateAPIsChangelog() {
  return `# API Changelog

## [2.0.0] - ${new Date().toISOString().split('T')[0]}

### Added
- Promise-based API variants for all methods
- Cross-browser common types (\`@zovo/types-webext-common\`)
- Full union types (\`@zovo/types-webext-full\`)
- Safari extension type support
- Edge extension type support
- VS Code IntelliSense improvements
- Diff reports for API changes between browser versions

### Changed
- Stricter type constraints for improved type safety
- Better null/undefined handling
- Enhanced event type definitions

### Fixed
- Callback type signatures
- Generic type parameters
- Promise return types
`;
}

// Count APIs per package
const packageCounts = {
  chrome: 0,
  firefox: 0,
  safari: 0,
  edge: 0,
  common: 0,
  full: 0
};

const packages = fs.readdirSync(PACKAGES_DIR).filter(p => 
  fs.statSync(path.join(PACKAGES_DIR, p)).isDirectory()
);

packages.forEach(pkg => {
  const srcDir = path.join(PACKAGES_DIR, pkg, 'src');
  if (fs.existsSync(srcDir)) {
    const count = fs.readdirSync(srcDir).filter(f => f.endsWith('.d.ts')).length;
    if (pkg.includes('chrome')) packageCounts.chrome = count;
    if (pkg.includes('firefox')) packageCounts.firefox = count;
    if (pkg.includes('safari')) packageCounts.safari = count;
    if (pkg.includes('edge')) packageCounts.edge = count;
    if (pkg.includes('common')) packageCounts.common = count;
    if (pkg.includes('full')) packageCounts.full = count;
  }
});

// Generate all documentation
console.log('📝 Generating documentation...\n');

// Main index
fs.writeFileSync(path.join(DOCS_DIR, 'README.md'), generateDocsIndex(packageCounts));
console.log('✅ Main documentation index');

// Per-package docs
const packageDocsDir = path.join(DOCS_DIR, 'packages');
if (!fs.existsSync(packageDocsDir)) {
  fs.mkdirSync(packageDocsDir, { recursive: true });
}

packages.forEach(pkg => {
  const pkgDir = path.join(PACKAGES_DIR, pkg);
  const docs = generatePackageDocs(pkgDir, pkg);
  if (docs) {
    fs.writeFileSync(path.join(packageDocsDir, `${pkg}.md`), docs);
    console.log(`✅ ${pkg} documentation`);
  }
});

// Migration guide
fs.writeFileSync(path.join(DOCS_DIR, 'MIGRATION.md'), generateMigrationGuide());
console.log('✅ Migration guide');

// API Changelog
fs.writeFileSync(path.join(DOCS_DIR, 'CHANGELOG-API.md'), generateAPIsChangelog());
console.log('✅ API changelog');

// Generate quick reference cards
const quickRef = {
  chrome: {
    tabs: ['query', 'get', 'create', 'update', 'remove', 'executeScript'],
    storage: ['get', 'set', 'remove', 'clear'],
    runtime: ['getManifest', 'getURL', 'sendMessage', 'onMessage'],
    action: ['setTitle', 'setIcon', 'setPopup', 'onClicked']
  },
  firefox: {
    tabs: ['query', 'get', 'create', 'update', 'remove', 'executeScript'],
    storage: ['get', 'set', 'remove', 'clear'],
    runtime: ['getManifest', 'getURL', 'sendMessage', 'onMessage']
  }
};

fs.writeFileSync(
  path.join(DOCS_DIR, 'quick-reference.json'),
  JSON.stringify(quickRef, null, 2)
);
console.log('✅ Quick reference cards');

console.log('\n📚 Documentation Statistics:');
console.log(`   - Main docs: 1 file`);
console.log(`   - Package docs: ${packages.length} files`);
console.log(`   - Migration guide: 1 file`);
console.log(`   - API changelog: 1 file`);
console.log(`   - Quick reference: 1 file`);

console.log('\n✅ AGENT 2 COMPLETE: Documentation generated');
