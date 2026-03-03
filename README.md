# @zovo/types-webext

[![npm version](https://img.shields.io/npm/v/@zovo/types-chrome-extension)](https://npmjs.com/package/@zovo/types-chrome-extension)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![CI Status](https://github.com/theluckystrike/zovo-types-webext/actions/workflows/ci.yml/badge.svg)](https://github.com/theluckystrike/zovo-types-webext/actions)
[![Discord](https://img.shields.io/badge/Discord-Zovo-blueviolet.svg?logo=discord)](https://discord.gg/zovo)
[![GitHub Stars](https://img.shields.io/github/stars/theluckystrike/zovo-types-webext?style=social)](https://github.com/theluckystrike/zovo-types-webext)

Comprehensive TypeScript type definitions for browser extensions across Chrome, Firefox, Safari, and Edge.

Part of the [Zovo](https://zovo.one) family of privacy-first Chrome extensions.

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| `@zovo/types-chrome-extension` | Chrome/Chromium APIs | [![npm version](https://img.shields.io/npm/v/@zovo/types-chrome-extension)](https://npmjs.com/package/@zovo/types-chrome-extension) |
| `@zovo/types-firefox-extension` | Firefox WebExtension APIs | [![npm version](https://img.shields.io/npm/v/@zovo/types-firefox-extension)](https://npmjs.com/package/@zovo/types-firefox-extension) |
| `@zovo/types-safari-extension` | Safari App Extension APIs | [![npm version](https://img.shields.io/npm/v/@zovo/types-safari-extension)](https://npmjs.com/package/@zovo/types-safari-extension) |
| `@zovo/types-edge-extension` | Microsoft Edge APIs | [![npm version](https://img.shields.io/npm/v/@zovo/types-edge-extension)](https://npmjs.com/package/@zovo/types-edge-extension) |
| `@zovo/types-webext-common` | Cross-browser intersection | [![npm version](https://img.shields.io/npm/v/@zovo/types-webext-common)](https://npmjs.com/package/@zovo/types-webext-common) |
| `@zovo/types-webext-full` | Full union of all browsers | [![npm version](https://img.shields.io/npm/v/@zovo/types-webext-full)](https://npmjs.com/package/@zovo/types-webext-full) |
| `@zovo/type-helpers` | Advanced TypeScript utilities | [![npm version](https://img.shields.io/npm/v/@zovo/type-helpers)](https://npmjs.com/package/@zovo/type-helpers) |

## Quick Start

```bash
# Install your preferred package
npm install @zovo/types-chrome-extension
# or
npm install @zovo/types-firefox-extension
```

### VS Code

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@zovo/types-chrome-extension"]
  }
}
```

### Usage

Once you've added the types to your `tsconfig.json`, the `chrome` API is available globally:

```typescript
// Query tabs
const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

// Use storage
await chrome.storage.local.set({ key: 'value' });
const result = await chrome.storage.local.get('key');

// Send messages
chrome.runtime.sendMessage({ type: 'GREETING' }, (response) => {
  console.log(response);
});
```

Alternatively, you can use an ambient import in each file that needs chrome types:

```typescript
/// <reference types="@zovo/types-chrome-extension" />

// Now chrome is available globally in this file
const tabs = await chrome.tabs.query({ active: true });
```

## Features

- ✅ **Complete Type Coverage** - All browser extension APIs fully typed
- ✅ **Promise Support** - Both callback and Promise-based APIs
- ✅ **Cross-Browser** - Common types for Chrome, Firefox, Safari, Edge
- ✅ **MV3 Ready** - Manifest V3 support including service workers
- ✅ **Advanced Types** - Utility types for better developer experience
- ✅ **Auto-Updated** - Weekly updates from browser source

## Documentation

- [Migration Guide](docs/MIGRATION.md) - Migrating from @types/chrome
- [API Reference](docs/) - Full API documentation
- [Type Utilities](docs/TYPES.md) - Advanced TypeScript types

## CI/CD

This project uses GitHub Actions for continuous integration and deployment:

| Workflow | Trigger | Description |
|----------|---------|-------------|
| CI | Push/PR | Runs tests, type checks, and builds |
| Weekly Update | Weekly (Sunday) | Auto-updates API definitions |
| Release | Push to main | Publishes packages to npm |

### Required Secrets

To enable publishing, add these secrets to your GitHub repository:

- `NPM_TOKEN` - npm access token with package publish permissions
- `GITHUB_TOKEN` - Automatically provided by GitHub

## Development

```bash
# Clone the repo
git clone https://github.com/theluckystrike/zovo-types-webext.git
cd zovo-types-webext

# Install dependencies
npm install

# Run quality validation
npm run validate

# Generate documentation
npm run docs

# Run tests
npm test

# Full build
npm run build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run validation: `npm run validate`
5. Submit a Pull Request

## See Also

### Related Zovo Repositories

- [zovo-extension-template](https://github.com/theluckystrike/zovo-extension-template) - Boilerplate for building privacy-first Chrome extensions
- [zovo-chrome-extensions](https://github.com/theluckystrike/zovo-chrome-extensions) - Collection of Zovo Chrome extensions
- [zovo-indexer](https://github.com/theluckystrike/zovo-indexer) - SEO indexing tool
- [zovo-permissions-scanner](https://github.com/theluckystrike/zovo-permissions-scanner) - Privacy scanner for Chrome extensions
- [zovo-content](https://github.com/theluckystrike/zovo-content) - Marketing content for Zovo extensions
- [webext-bridge](https://github.com/theluckystrike/webext-bridge) - Cross-context messaging for WebExtensions
- [webext-storage-sync](https://github.com/theluckystrike/webext-storage-sync) - Cross-device storage sync

### Chrome Web Store Extensions Using These Types

- [Zovo Tab Manager](https://chrome.google.com/webstore/detail/zovo-tab-manager) - Tab management made simple
- [Zovo Focus](https://chrome.google.com/webstore/detail/zovo-focus) - Stay focused with distraction blocking
- [Zovo Permissions Scanner](https://chrome.google.com/webstore/detail/zovo-permissions-scanner) - Check extension privacy grades

Visit [zovo.one](https://zovo.one) for more information.

## License

MIT - [Zovo](https://zovo.one)
