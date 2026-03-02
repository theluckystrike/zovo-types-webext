# @zovo/types-webext

Comprehensive TypeScript type definitions for browser extensions across Chrome, Firefox, Safari, and Edge.

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

```typescript
import { chrome } from '@zovo/types-chrome-extension';

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

## License

MIT
