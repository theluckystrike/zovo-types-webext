# @zovo/types-webext Documentation

## Overview

Comprehensive TypeScript type definitions for browser extensions across Chrome, Firefox, Safari, and Edge.

## Packages

| Package | Description | APIs |
|---------|-------------|------|
| @zovo/types-chrome-extension | Chrome/Chromium APIs | 1 namespaces |
| @zovo/types-firefox-extension | Firefox WebExtension APIs | 1 namespaces |
| @zovo/types-safari-extension | Safari App Extension APIs | 1 namespaces |
| @zovo/types-edge-extension | Microsoft Edge APIs | 1 namespaces |
| @zovo/types-webext-common | Cross-browser intersection | 1 APIs |
| @zovo/types-webext-full | Full union of all browsers | 1 APIs |

## Quick Start

```bash
npm install @zovo/types-chrome-extension
```

### VS Code
Add to `tsconfig.json`:
```json
{
  "types": ["@zovo/types-chrome-extension"]
}
```

### TypeScript
```typescript
import { chrome } from '@zovo/types-chrome-extension';

chrome.tabs.query({ active: true }, (tabs) => {
  console.log(tabs[0].id);
});
```

## Browser Compatibility

See [`cross-browser-compatibility.json`](../cross-browser-compatibility.json) for detailed compatibility matrix.

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md)

## License

MIT
