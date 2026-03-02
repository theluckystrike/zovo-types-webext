# @zovo/crx-security-audit

Find security issues in Chrome extension code - XSS, CSP, storage, and more.

## Usage

```bash
npx crx-security-audit ./my-extension
```

## Checks

- **XSS**: innerHTML, eval, document.write, inline handlers
- **CSP**: unsafe-inline, unsafe-eval, wildcards
- **Storage**: passwords/tokens in localStorage
- **Permissions**: overreaching host permissions
- **Content Scripts**: DOM XSS patterns

## Example

```
🔒 SECURITY AUDIT

📊 SUMMARY
─────────────────────────────────────────────────────────────────
  Total Issues:       5
  🔴 Critical:        1
  🟠 High:            2
  
  ❌ CWS Rejection Risk: HIGH

🔴 [CRITICAL] xss
   📁 background.js:15
   eval(...)
   → eval() usage - arbitrary code execution
   ⚠️ CWS: CWS rejection likely
```
