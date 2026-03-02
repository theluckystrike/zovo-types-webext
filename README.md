# @zovo/types-webext

Comprehensive TypeScript type definitions for browser extensions, supporting Chrome, Firefox, Safari, and Edge with cross-browser compatibility.

## Packages

| Package | Description | NPM |
|---------|-------------|-----|
| `@zovo/types-chrome-extension` | Chrome Extensions (Manifest V3) | [View](https://npmjs.com/package/zovo/types-chrome-extension) |
| `@zovo/types-firefox-extension` | Firefox WebExtensions | [View](https://npmjs.com/package/zovo/types-firefox-extension) |
| `@zovo/types-safari-extension` | Safari App Extensions | [View](https://npmjs.com/package/zovo/types-safari-extension) |
| `@zovo/types-edge-extension` | Microsoft Edge Extensions | [View](https://npmjs.com/package/zovo/types-edge-extension) |
| `@zovo/types-webext-common` | Cross-browser compatible types | [View](https://npmjs.com/package/zovo/types-webext-common) |
| `@zovo/types-webext-full` | Union types with browser discriminators | [View](https://npmjs.com/package/zovo/types-webext-full) |

## Features

- ✅ **Chrome, Firefox, Safari, Edge** support
- ✅ **Cross-browser compatibility** utilities
- ✅ **Better than @types/chrome** - more accurate, Promise-based APIs
- ✅ **Auto-generated** from browser source definitions
- ✅ **Weekly updates** - stays current with browser releases

## Quick Start

```bash
# Install
npm install @zovo/types-chrome-extension
# or for cross-browser
npm install @zovo/types-webext-common
```

## Usage

### Chrome Extension

```typescript
import type { chrome } from '@zovo/types-chrome-extension';

// Get active tab - typed result!
const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
const tab = tabs[0];

// Storage - Promise-based
await chrome.storage.local.set({ myKey: 'myValue' });
const result = await chrome.storage.local.get('myKey');
```

### Firefox Extension

```typescript
import type { browser } from '@zovo/types-firefox-extension';

// Same API, different namespace
const tabs = await browser.tabs.query({ active: true });
```

### Cross-Browser

```typescript
import type { chrome } from '@zovo/types-chrome-extension';

// Use @zovo/types-webext-common for types that work everywhere
// Use feature detection for browser-specific APIs
if (typeof chrome.sidePanel !== 'undefined') {
  // Edge/Chrome only
}
```

## VS Code Improvements

This package provides IntelliSense improvements over `@types/chrome`:

- **Promise-based APIs** - `await chrome.tabs.query()` instead of callbacks
- **Typed messages** - Type-safe runtime.sendMessage()
- **Manifest validation** - Compile-time manifest.json checking
- **Event typing** - Proper parameter inference for event listeners

See [vscode-improvements.json](vscode-improvements.json) for full details.

## API Sources

Types are auto-generated from:

- **Chrome**: chromium.googlesource.com IDL files
- **Firefox**: mozilla-central WebExtension schemas
- **Safari**: WebKit + Apple documentation
- **Edge**: Chrome APIs + Edge-specific extensions

## Development

```bash
# Install dependencies
npm install

# Run full pipeline
npm run build

# Run tests
npm run test

# Generate diff reports
npm run diff

# Generate changelog
npm run changelog

# Weekly loop (continuous)
npm run loop
```

## Outputs

After running the pipeline:

```
├── packages/
│   ├── types-chrome-extension/    # Chrome-specific types
│   ├── types-firefox-extension/   # Firefox-specific types
│   ├── types-safari-extension/    # Safari-specific types
│   ├── types-edge-extension/     # Edge-specific types
│   ├── types-webext-common/       # Intersection of all browsers
│   └── types-webext-full/         # Union with discriminators
├── diff-reports/                  # API change reports
├── blog-posts/                    # "What's New" posts
├── cross-browser-compatibility.json  # Machine-readable compatibility
├── vscode-improvements.json       # IDE enhancements
└── CHANGELOG.md                   # Version history
```

## Bonus Outputs

### Browser API Diff Reports

Track what changed between browser versions:

```bash
npm run diff
# Generates diff-reports/chrome-diff-120-121.json
```

### Cross-Browser Compatibility JSON

Machine-readable compatibility data:

```bash
npm run compat
# Generates cross-browser-compatibility.json
```

### "What's New" Blog Posts

Auto-generated release notes per browser:

```bash
npm run blog
# Generates blog-posts/chrome-whats-new-121.md
```

### VS Code IntelliSense

Enhanced IDE support:

```bash
npm run vscode
# Generates .vscode/settings.json and snippets
```

## Comparison with @types/chrome

| Feature | @types/chrome | @zovo/types-* |
|---------|---------------|---------------|
| Promise support | ❌ Callbacks only | ✅ Native async |
| Firefox support | ❌ Chrome only | ✅ Full support |
| Safari support | ❌ | ✅ |
| Edge support | ❌ | ✅ |
| Cross-browser types | ❌ | ✅ Common + Full |
| Auto-updates | ❌ Manual | ✅ Weekly |
| Type accuracy | Basic | Enhanced |

## License

MIT

## Contributing

PRs welcome! This is an automated pipeline - types are generated from browser sources.
