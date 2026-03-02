# @zovo/crx-permission-analyzer

Audit Chrome extension permissions with risk levels and CWS review warnings.

## Installation

```bash
npx crx-permission-analyzer ./manifest.json
```

## Features

- Risk level assessment (low/medium/high/critical)
- CWS review warning detection
- Host permission analysis
- Recommendations for CWS approval

## Example

```
🔴 PERMISSION AUDIT - Risk: HIGH

📊 SUMMARY
─────────────────────────────────────────────────────────────────
  Total Permissions: 8
  Risky Permissions:  2
  CWS Rejection Risk: ⚠️ HIGH

🔐 PERMISSIONS
─────────────────────────────────────────────────────────────────
  🟠 webRequest → Intercept network requests
     ⚠️ Strict review required
  🟡 cookies → Read/write cookies across sites
     → Requires justification
```
