// Agent 2: Build crx-permission-analyzer
const fs = require('fs');
const path = require('path');

const projectRoot = '/Users/mike/zovo-types/packages/crx-permission-analyzer';

console.log('Building crx-permission-analyzer...');

// Create directory structure
const dirs = ['src', 'tests/fixtures', '.github/workflows'];
dirs.forEach(d => {
  const dir = path.join(projectRoot, d);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// package.json
const pkgJson = {
  "name": "@zovo/crx-permission-analyzer",
  "version": "1.0.0",
  "description": "Audit Chrome extension permissions with risk assessment",
  "main": "dist/index.js",
  "bin": { "crx-permission-analyzer": "./dist/cli.js" },
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "commander": "^11.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  },
  "keywords": ["chrome-extension", "permissions", "security", "audit"],
  "license": "MIT"
};
fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify(pkgJson, null, 2));

// Permission database
const permissionsDb = {
  "tabs": { risk: "medium", reason: "Access to all tab URLs and titles", cwsWarning: "Requires prominent disclosure" },
  "activeTab": { risk: "low", reason: "Access only when user invokes extension", cwsWarning: null },
  "storage": { risk: "low", reason: "Local storage access", cwsWarning: null },
  "cookies": { risk: "medium", reason: "Read/write cookies across sites", cwsWarning: "Requires justification" },
  "history": { risk: "high", reason: "Full browsing history access", cwsWarning: "Strict review required" },
  "bookmarks": { risk: "medium", reason: "Read/write bookmarks", cwsWarning: "Requires disclosure" },
  "clipboardRead": { risk: "high", reason: "Read clipboard contents", cwsWarning: "CWS rejection likely" },
  "clipboardWrite": { risk: "medium", reason: "Write to clipboard", cwsWarning: "Requires disclosure" },
  "geolocation": { risk: "high", reason: "Access user location", cwsWarning: "Requires prominent disclosure" },
  "notifications": { risk: "low", reason: "Show notifications", cwsWarning: null },
  "webRequest": { risk: "high", reason: "Intercept/modify network requests", cwsWarning: "Strict review, may require external hosting" },
  "webRequestBlocking": { risk: "high", reason: "Block network requests", cwsWarning: "CWS rejection likely" },
  "declarativeNetRequest": { risk: "medium", reason: "Block requests declaratively", cwsWarning: "Less strict than webRequest" },
  "scripting": { risk: "medium", reason: "Execute scripts in pages", cwsWarning: "Requires disclosure" },
  "debugger": { risk: "critical", reason: "Full debugging capabilities", cwsWarning: "CWS rejection guaranteed" },
  "management": { risk: "medium", reason: "Manage other extensions", cwsWarning: "Requires strong justification" },
  "identity": { risk: "medium", reason: "OAuth functionality", cwsWarning: null },
  "idle": { risk: "low", reason: "Detect user idle state", cwsWarning: null },
  "power": { risk: "low", reason: "Manage power settings", cwsWarning: null },
  "system": { risk: "medium", reason: "System information", cwsWarning: null },
  "topSites": { risk: "medium", reason: "Access browsing history top sites", cwsWarning: "Requires disclosure" },
  "downloads": { risk: "medium", reason: "Manage downloads", cwsWarning: null },
  "downloads.open": { risk: "high", reason: "Open downloaded files", cwsWarning: "Strict review" },
  "pageCapture": { risk: "medium", reason: "Save pages as MHTML", cwsWarning: null },
  "tabCapture": { risk: "high", reason: "Capture tab content", cwsWarning: "Requires strong justification" },
  "privacy": { risk: "medium", reason: "Control privacy settings", cwsWarning: null },
  "sessions": { risk: "medium", reason: "Access recently closed tabs", cwsWarning: null },
  "contentSettings": { risk: "high", reason: "Change content settings (cookies, JS, etc)", cwsWarning: "Strict review" },
  "proxy": { risk: "high", reason: "Manage proxy settings", cwsWarning: "CWS rejection likely" },
  "vpnProvider": { risk: "critical", reason: "VPN functionality", cwsWarning: "Not allowed on CWS" }
};

// src/core.ts
const coreTs = `import * as fs from 'fs';
import * as path from 'path';

const PERMISSIONS_DB = ${JSON.stringify(permissionsDb, null, 2)};

export interface Permission {
  name: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  cwsWarning: string | null;
  required: boolean;
}

export interface HostPermission {
  pattern: string;
  risk: 'low' | 'medium' | 'high';
  reason: string;
}

export interface AuditReport {
  permissions: Permission[];
  hostPermissions: HostPermission[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  totalPermissions: number;
  riskyPermissions: number;
  cwsRejectionRisk: boolean;
  recommendations: string[];
}

function parsePermission(perm: string, required: boolean): Permission | null {
  const dbEntry = PERMISSIONS_DB[perm];
  if (dbEntry) {
    return {
      name: perm,
      risk: dbEntry.risk as Permission['risk'],
      reason: dbEntry.reason,
      cwsWarning: dbEntry.cwsWarning,
      required
    };
  }
  return null;
}

function parseHostPermission(host: string): HostPermission {
  let risk: HostPermission['risk'] = 'low';
  let reason = 'Specific host access';
  
  if (host === '<all_urls>' || host === '*://*/*' || host === 'http://*/*' || host === 'https://*/*') {
    risk = 'high';
    reason = 'Access to all websites';
  } else if (host.includes('*')) {
    risk = 'medium';
    reason = 'Wildcard host pattern';
  }
  
  return { pattern: host, risk, reason };
}

export function analyzePermissions(manifestPath: string): AuditReport {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  
  const permissions: Permission[] = [];
  const hostPermissions: HostPermission[] = [];
  
  // Parse permissions
  if (manifest.permissions) {
    for (const perm of manifest.permissions) {
      const parsed = parsePermission(perm, true);
      if (parsed) permissions.push(parsed);
    }
  }
  
  // Parse optional permissions
  if (manifest.optional_permissions) {
    for (const perm of manifest.optional_permissions) {
      const parsed = parsePermission(perm, false);
      if (parsed) permissions.push(parsed);
    }
  }
  
  // Parse host permissions
  const allHosts = [...(manifest.permissions || []), ...(manifest.host_permissions || [])]
    .filter(p => typeof p === 'string' && (p.includes('://') || p.includes('<all_urls>')));
  
  for (const host of allHosts) {
    hostPermissions.push(parseHostPermission(host));
  }
  
  // Calculate risk
  const allPerms = [...permissions.map(p => p.risk), ...hostPermissions.map(h => h.risk)];
  const hasCritical = allPerms.includes('critical');
  const hasHigh = allPerms.includes('high');
  
  let overallRisk: AuditReport['overallRisk'] = 'low';
  if (hasCritical) overallRisk = 'critical';
  else if (hasHigh) overallRisk = 'high';
  else if (allPerms.includes('medium')) overallRisk = 'medium';
  
  // CWS rejection risk
  const riskyPerms = permissions.filter(p => p.cwsWarning !== null);
  const cwsRejectionRisk = hasCritical || riskyPerms.length > 3;
  
  // Recommendations
  const recommendations: string[] = [];
  if (hostPermissions.some(h => h.risk === 'high')) {
    recommendations.push('Consider using activeTab instead of <all_urls> for user-initiated access');
  }
  if (permissions.some(p => p.name === 'webRequest' || p.name === 'webRequestBlocking')) {
    recommendations.push('Use declarativeNetRequest for blocking ads/trackers - less review friction');
  }
  if (permissions.some(p => p.name === 'clipboardRead')) {
    recommendations.push('clipboardRead almost always causes CWS rejection - remove if possible');
  }
  if (permissions.length > 10) {
    recommendations.push('Consider splitting into multiple extensions if permissions are unrelated');
  }
  
  return {
    permissions,
    hostPermissions,
    overallRisk,
    totalPermissions: permissions.length + hostPermissions.length,
    riskyPermissions: riskyPerms.length,
    cwsRejectionRisk,
    recommendations
  };
}

export function formatReport(report: AuditReport): string {
  const riskEmoji = { low: '🟢', medium: '🟡', high: '🟠', critical: '🔴' };
  
  let output = \`\${riskEmoji[report.overallRisk]} PERMISSION AUDIT - Risk: \${report.overallRisk.toUpperCase()}

📊 SUMMARY
─────────────────────────────────────────────────────────────────
  Total Permissions: \${report.totalPermissions}
  Risky Permissions:  \${report.riskyPermissions}
  CWS Rejection Risk: \${report.cwsRejectionRisk ? '⚠️ HIGH' : '✅ LOW'}

🔐 PERMISSIONS
─────────────────────────────────────────────────────────────────\`;
  
  for (const p of report.permissions) {
    output += \`\n  \${riskEmoji[p.risk]} \${p.name}\${!p.required ? ' (optional)' : ''}\`;
    output += \`\n     → \${p.reason}\`;
    if (p.cwsWarning) output += \`\n     ⚠️ \${p.cwsWarning}\`;
  }
  
  if (report.hostPermissions.length > 0) {
    output += \`\n\n🌐 HOST PERMISSIONS\n─────────────────────────────────────────────────────────────────\`;
    for (const h of report.hostPermissions) {
      output += \`\n  \${riskEmoji[h.risk]} \${h.pattern}\`;
      output += \`\n     → \${h.reason}\`;
    }
  }
  
  if (report.recommendations.length > 0) {
    output += \`\n\n💡 RECOMMENDATIONS\n─────────────────────────────────────────────────────────────────\`;
    for (const r of report.recommendations) {
      output += \`\n  • \${r}\`;
    }
  }
  
  return output;
}
`;
fs.writeFileSync(path.join(projectRoot, 'src/core.ts'), coreTs);

// src/cli.ts
const cliTs = `import { Command } from 'commander';
import { analyzePermissions, formatReport } from './core';

const program = new Command();

program
  .name('crx-permission-analyzer')
  .description('Audit Chrome extension permissions with risk assessment')
  .version('1.0.0')
  .argument('<manifest>', 'Path to manifest.json')
  .action((manifestPath: string) => {
    try {
      const report = analyzePermissions(manifestPath);
      console.log(formatReport(report));
    } catch (error) {
      console.error('Error analyzing permissions:', error);
      process.exit(1);
    }
  });

program.parse();
`;
fs.writeFileSync(path.join(projectRoot, 'src/cli.ts'), cliTs);

// src/index.ts
fs.writeFileSync(path.join(projectRoot, 'src/index.ts'), `export { analyzePermissions, formatReport, AuditReport, Permission, HostPermission } from './core';`);

// tsconfig.json
fs.writeFileSync(path.join(projectRoot, 'tsconfig.json'), JSON.stringify({
  compilerOptions: { target: "ES2020", module: "commonjs", outDir: "./dist", strict: true, esModuleInterop: true, skipLibCheck: true },
  include: ["src/**/*"]
}, null, 2));

// README.md
const readme = `# @zovo/crx-permission-analyzer

Audit Chrome extension permissions with risk levels and CWS review warnings.

## Installation

\`\`\`bash
npx crx-permission-analyzer ./manifest.json
\`\`\`

## Features

- Risk level assessment (low/medium/high/critical)
- CWS review warning detection
- Host permission analysis
- Recommendations for CWS approval

## Example

\`\`\`
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
\`\`\`
`;
fs.writeFileSync(path.join(projectRoot, 'README.md'), readme);

// Test fixture - ensure directory exists first
const testFixtureDir = path.join(projectRoot, 'tests/fixtures/test-extension');
if (!fs.existsSync(testFixtureDir)) fs.mkdirSync(testFixtureDir, { recursive: true });
const testManifest = {
  manifest_version: 3,
  name: "Test Extension",
  version: "1.0.0",
  permissions: ["tabs", "cookies", "storage", "webRequest", "clipboardRead"],
  host_permissions: ["<all_urls>"]
};
fs.writeFileSync(path.join(testFixtureDir, 'manifest.json'), JSON.stringify(testManifest, null, 2));

console.log('✅ crx-permission-analyzer built successfully');
