import * as fs from 'fs';

const SCHEMAS = {"chrome":{"manifest_version":[2,3],"required":["name","version","manifest_version"],"mv2":{"permissions":["activeTab","alarms","bookmarks","clipboardRead","clipboardWrite","contentSettings","cookies","contextMenus","debugger","declarativeContent","declarativeNetRequest","desktopCapture","downloads","enterprise.deviceAttributes","enterprise.hardwarePlatform","enterprise.networkingAttributes","enterprise.platformKeys","experimental","fileBrowserHandler","fileSystemProvider","fontSettings","gcm","geolocation","history","identity","idle","input","loginState","management","nativeMessaging","notifications","offscreen","pageCapture","power","printerProvider","printing","printingMetrics","privacy","processes","proxy","scripting","search","sessions","sidePanel","storage","system.cpu","system.memory","system.storage","tabCapture","tabGroups","tabs","topSites","tts","ttsEngine","unlimitedStorage","vpnProvider","wallpaper","webNavigation","webRequest","webRequestBlocking"]},"mv3":{"permissions":["activeTab","alarms","bookmarks","clipboardRead","clipboardWrite","contentSettings","cookies","contextMenus","declarativeContent","declarativeNetRequest","declarativeNetRequestWithHostAccess","desktopCapture","downloads","enterprise.deviceAttributes","enterprise.hardwarePlatform","enterprise.networkingAttributes","enterprise.platformKeys","experimental","fileBrowserHandler","fileSystemProvider","fontSettings","gcm","geolocation","history","identity","idle","input","loginState","management","nativeMessaging","notifications","offscreen","pageCapture","power","printerProvider","printing","printingMetrics","privacy","processes","proxy","scripting","search","sessions","sidePanel","storage","system.cpu","system.memory","system.storage","tabCapture","tabGroups","tabs","topSites","tts","ttsEngine","unlimitedStorage","vpnProvider","wallpaper","webNavigation","webRequest"],"host_permissions":["<all_urls>","*://*/*","http://*/*","https://*/*"]},"fields":{"name":{"type":"string","minLength":1,"maxLength":45},"version":{"type":"string","pattern":"^(\\\\d+\\\\.\\\\d+\\\\.\\\\d+.*)?$"},"description":{"type":"string","maxLength":450},"icons":{"type":"object","properties":{"16":"string","32":"string","48":"string","128":"string","256":"string"}},"action":{"mv":3},"background":{"mv":[2,3],"properties":{"scripts":"array","service_worker":"string"}}}},"firefox":{"manifest_version":[2,3],"permissions":["activeTab","alarms","bookmarks","browserSettings","clipboardRead","clipboardWrite","contentSettings","cookies","contextMenus","debugger","declarativeNetRequest","desktopCapture","downloads","experimental","fontSettings","geolocation","history","identity","idle","management","menus","nativeMessaging","notifications","pageCapture","power","privacy","proxy","scripting","sessions","storage","tabCapture","tabs","topSites","tts","unlimitedStorage","webNavigation","webRequest"],"extra_keys":["browser_specific_settings","browser_action","manifest_version"]},"safari":{"manifest_version":[2,3],"permissions":["activeTab","alarms","bookmarks","clipboard","contentSettings","cookies","history","idle","management","notifications","storage","tabs","topSites","webNavigation"],"requirements":["mac Catalyst","macos"]},"edge":{"manifest_version":[2,3],"permissions":["activeTab","alarms","bookmarks","clipboardRead","clipboardWrite","contentSettings","cookies","contextMenus","declarativeContent","declarativeNetRequest","desktopCapture","downloads","experimental","fileSystemProvider","fontSettings","gcm","geolocation","history","identity","idle","input","management","nativeMessaging","notifications","offscreen","pageCapture","power","privacy","proxy","scripting","search","sessions","sidePanel","storage","system.cpu","system.memory","system.storage","tabCapture","tabs","topSites","tts","unlimitedStorage","webNavigation","webRequest"]}};

export type Browser = 'chrome' | 'firefox' | 'safari' | 'edge';

export interface ValidationIssue {
  type: 'error' | 'warning' | 'suggestion';
  browser: Browser | 'all';
  field: string;
  message: string;
  fix?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  summary: { errors: number; warnings: number; suggestions: number };
  browserSupport: Record<Browser, { supported: boolean; issues: string[] }>;
}

function getManifestVersion(manifest: any): number | null {
  return manifest.manifest_version || null;
}

export function validateManifest(manifestPath: string, browsers: Browser[] = ['chrome', 'firefox', 'safari', 'edge']): ValidationResult {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const issues: ValidationIssue[] = [];
  const mv = getManifestVersion(manifest);
  
  if (!mv) {
    issues.push({ type: 'error', browser: 'all', field: 'manifest_version', message: 'manifest_version is required' });
    return { valid: false, issues, summary: { errors: 1, warnings: 0, suggestions: 0 }, browserSupport: {} as any };
  }
  
  // Basic field validation
  if (!manifest.name) issues.push({ type: 'error', browser: 'all', field: 'name', message: 'name is required', fix: 'Add "name": "Your Extension Name"' });
  if (!manifest.version) issues.push({ type: 'error', browser: 'all', field: 'version', message: 'version is required', fix: 'Add "version": "1.0.0"' });
  if (manifest.name && manifest.name.length > 45) issues.push({ type: 'warning', browser: 'chrome', field: 'name', message: 'name exceeds 45 chars - may be truncated in CWS' });
  if (manifest.version && !/^\\d+\\.\\d+/.test(manifest.version)) issues.push({ type: 'error', browser: 'all', field: 'version', message: 'version must be in semver format', fix: 'Use "1.0.0" format' });
  
  // Manifest version validation
  if (mv === 2) {
    issues.push({ type: 'suggestion', browser: 'chrome', field: 'manifest_version', message: 'Manifest V2 is deprecated - migrate to V3', fix: 'Set "manifest_version": 3' });
  }
  
  // MV3 requirements
  if (mv === 3) {
    if (manifest.background && manifest.background.scripts) {
      issues.push({ type: 'error', browser: 'chrome', field: 'background.scripts', message: 'MV3 requires service_worker instead of background scripts', fix: 'Use "background": { "service_worker": "worker.js" }' });
    }
    if (manifest.browser_action) {
      issues.push({ type: 'suggestion', browser: 'chrome', field: 'browser_action', message: 'Use "action" instead of "browser_action" in MV3' });
    }
    if (manifest.optional_permissions) {
      const hasHostPermission = (manifest.optional_permissions as string[]).some(p => p.includes('://'));
      if (!hasHostPermission && !manifest.optional_host_permissions) {
        issues.push({ type: 'suggestion', browser: 'chrome', field: 'optional_permissions', message: 'Host permissions in optional_permissions require optional_host_permissions in MV3' });
      }
    }
  }
  
  // Icon validation
  if (!manifest.icons && !manifest.icons?.['128']) {
    issues.push({ type: 'warning', browser: 'all', field: 'icons', message: '128px icon is recommended for all browsers' });
  }
  
  // Check permissions across browsers
  const perms = manifest.permissions || [];
  const hostPerms = manifest.host_permissions || [];
  
  const browserSupport: ValidationResult['browserSupport'] = {} as any;
  
  for (const browser of browsers) {
    const schema = SCHEMAS[browser];
    if (!schema) continue;
    
    const browserIssues: string[] = [];
    const supported = true;
    
    // Check MV support
    if (!schema.manifest_version.includes(mv)) {
      browserIssues.push(`Manifest V${mv} not supported in ${browser}`);
    }
    
    // Check permissions
    const allowedPerms = schema.permissions || [];
    for (const p of perms) {
      if (!allowedPerms.includes(p)) {
        browserIssues.push(`Permission "${p}" not supported in ${browser}`);
      }
    }
    
    browserSupport[browser] = { supported: browserIssues.length === 0, issues: browserIssues };
  }
  
  // Safari-specific checks
  if (manifest.permissions?.includes('webRequest') || manifest.permissions?.includes('webRequestBlocking')) {
    issues.push({ type: 'warning', browser: 'safari', field: 'permissions', message: 'webRequest is not supported in Safari', fix: 'Use Safari-specific APIs or polyfills' });
  }
  
  // Edge-specific
  if (manifest.sidePanel && !manifest.sidePanel.default_path) {
    issues.push({ type: 'suggestion', browser: 'edge', field: 'sidePanel', message: 'sidePanel requires default_path in Edge' });
  }
  
  const summary = {
    errors: issues.filter(i => i.type === 'error').length,
    warnings: issues.filter(i => i.type === 'warning').length,
    suggestions: issues.filter(i => i.type === 'suggestion').length
  };
  
  return {
    valid: summary.errors === 0,
    issues,
    summary,
    browserSupport
  };
}

export function formatResult(result: ValidationResult): string {
  const icon = { error: '❌', warning: '⚠️', suggestion: '💡' };
  
  let output = `📋 MANIFEST VALIDATION

${result.valid ? '✅ Valid manifest' : '❌ Invalid manifest'}

📊 SUMMARY
─────────────────────────────────────────────────────────────────
  Errors:      ${result.summary.errors}
  Warnings:    ${result.summary.warnings}
  Suggestions: ${result.summary.suggestions}

${result.issues.map(i => `${icon[i.type]} ${i.field}${i.browser !== 'all' ? ` [${i.browser}]` : ''}
   ${i.message}${i.fix ? ` → Fix: ${i.fix}` : ''}`).join('\n')}

🌐 CROSS-BROWSER SUPPORT
─────────────────────────────────────────────────────────────────`;
  
  for (const [browser, info] of Object.entries(result.browserSupport)) {
    output += `
  ${info.supported ? '✅' : '⚠️'} ${browser}: ${info.supported ? 'Supported' : info.issues.join(', ')}`;
  }
  
  return output;
}
