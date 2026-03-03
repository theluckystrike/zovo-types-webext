# Examples

This directory contains comprehensive examples for using @zovo types in your browser extensions.

## Quick Examples

### Manifest V3
See [manifest.json](manifest.json) for a complete MV3 manifest.

### Background Script
See [background.ts](background.ts) for a full background service worker example with:
- Tab management
- Storage with type-safe wrapper
- Message passing
- Event handlers

### Content Script
See [content-script.ts](content-script.ts) for content script examples with:
- DOM manipulation
- Script injection
- CSS injection
- Background communication

### Popup
See [popup.ts](popup.ts) for popup UI examples with:
- State management
- Event handling
- Tab interaction

### Firefox
See [firefox/popup.ts](firefox/popup.ts) for Firefox-specific APIs:
- Browser namespace
- Sidebar API
- Theme API

## Usage

```bash
# Install types
npm install @zovo/types-chrome-extension
```

Then add to your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["@zovo/types-chrome-extension"]
  }
}
```

The `chrome` API is now available globally in your TypeScript files. Alternatively, use an ambient import:

```typescript
/// <reference types="@zovo/types-chrome-extension" />
```
