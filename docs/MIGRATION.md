# Migration Guide

## Upgrading from @types/chrome

### Key Differences

1. **Namespace Structure**
   - @types/chrome: `chrome.tabs.Tab`
   - @zovo: Direct imports `import { Tab } from '@zovo/types-chrome-extension'`

2. **Promise Support**
   - @types/chrome: Callback-based only
   - @zovo: Both callback AND Promise variants

3. **Type Safety**
   - @zovo provides stricter types for:
     - Tab URL and ID combinations
     - Storage type constraints
     - Message passing schemas

### Example Migration

```typescript
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
```

## Common Gotchas

1. **Nullable IDs**: Always check `tab.id` exists before using
2. **Permission Requirements**: Some APIs require manifest permissions
3. **Browser-Specific APIs**: Use `@zovo/types-webext-common` for cross-browser
