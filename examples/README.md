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

# In your TypeScript files
import { chrome } from '@zovo/types-chrome-extension';
```
