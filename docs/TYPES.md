# TypeScript Advanced Types

## Overview

This package provides sophisticated TypeScript type utilities for building robust browser extensions.

## Usage

```typescript
import { DeepPartial, AsyncReturnType, TabQueryOptions } from '@zovo/type-helpers';
```

## Utility Types

### DeepPartial<T>
Makes all properties optional recursively.

```typescript
type PartialTab = DeepPartial<chrome.tabs.Tab>;
// { id?: number, url?: string, ... }
```

### AsyncReturnType<T>
Extracts return type or unwraps Promise.

```typescript
type TabResult = AsyncReturnType<typeof chrome.tabs.query>;
// chrome.tabs.Tab[]
```

### TabQueryOptions
Pre-defined query options for tabs API.

```typescript
const query: TabQueryOptions = {
  active: true,
  currentWindow: true
};
```

## PromisifyAPI<T>

Converts callback-based Chrome API to Promise-based:

```typescript
type PromisifiedTabs = PromisifyAPI<typeof chrome.tabs>;
// { query: () => Promise<Tab[]>, create: () => Promise<Tab>, ... }
```
