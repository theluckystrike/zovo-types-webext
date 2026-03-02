// Agent 5: Build crx-security-audit
const fs = require('fs');
const path = require('path');

const projectRoot = '/Users/mike/zovo-types/packages/crx-security-audit';

console.log('Building crx-security-audit...');

const dirs = ['src', 'tests/fixtures', '.github/workflows'];
dirs.forEach(d => fs.mkdirSync(path.join(projectRoot, d), { recursive: true }));

// package.json
const pkgJson = {
  "name": "@zovo/crx-security-audit",
  "version": "1.0.0",
  "description": "Find security issues in Chrome extension code",
  "bin": { "crx-security-audit": "./dist/cli.js" },
  "scripts": { "build": "tsc", "test": "jest" },
  "dependencies": { "commander": "^11.0.0", "esprima": "^4.0.0" },
  "devDependencies": { "typescript": "^5.0.0", "@types/node": "^20.0.0" },
  "keywords": ["chrome-extension", "security", "audit", "xss", "csp"],
  "license": "MIT"
};
fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify(pkgJson, null, 2));

// Security patterns to check
const securityPatterns = {
  xss: [
    { pattern: /innerHTML\s*=/, severity: 'high', message: 'innerHTML assignment - use textContent or sanitize', cws: 'Potential XSS - will require review' },
    { pattern: /insertAdjacentHTML\s*\(/, severity: 'high', message: 'insertAdjacentHTML - use DOM APIs', cws: 'Potential XSS' },
    { pattern: /document\.write\s*\(/, severity: 'high', message: 'document.write - deprecated and unsafe', cws: 'CWS rejection risk' },
    { pattern: /eval\s*\(/, severity: 'critical', message: 'eval() usage - arbitrary code execution', cws: 'CWS rejection likely' },
    { pattern: /Function\s*\(/, severity: 'critical', message: 'Function constructor - like eval()', cws: 'CWS rejection likely' },
    { pattern: /src\s*=\s*["\']javascript:/, severity: 'high', message: 'javascript: URL in src attribute', cws: 'XSS risk' },
    { pattern: /onclick\s*=/, severity: 'medium', message: 'Inline event handler - use addEventListener', cws: 'Best practice violation' },
    { pattern: /onerror\s*=/, severity: 'medium', message: 'Inline error handler', cws: 'Best practice violation' },
    { pattern: /<script[^>]*>/i, severity: 'medium', message: 'Inline script tag - use external file', cws: 'CSP violation' },
    { pattern: /dangerouslySetInnerHTML/, severity: 'high', message: 'React dangerouslySetInnerHTML - ensure sanitization', cws: 'Requires code review' }
  ],
  csp: [
    { pattern: /script-src/, severity: 'low', message: 'script-src directive', cws: null },
    { pattern: /unsafe-inline/, severity: 'high', message: 'unsafe-inline in CSP - weakens security', cws: 'Will require justification' },
    { pattern: /unsafe-eval/, severity: 'high', message: 'unsafe-eval in CSP - allows eval()', cws: 'Strict review required' },
    { pattern: /\*\s*;\s*script-src/, severity: 'medium', message: 'Wildcard in script-src', cws: 'Security risk' }
  ],
  permissions: [
    { pattern: /<all_urls>/, severity: 'medium', message: 'Access to all URLs - requires strong justification', cws: 'Requires prominent disclosure' },
    { pattern: /http:\/\/\*/, severity: 'medium', message: 'Access to all HTTP sites', cws: 'Security concern' },
    { pattern: /https:\/\/*/, severity: 'medium', message: 'Access to all HTTPS sites', cws: 'Requires disclosure' }
  ],
  storage: [
    { pattern: /localStorage\.setItem\s*\(\s*["\'][^"\']*password/, severity: 'critical', message: 'Storing passwords in localStorage', cws: 'Security vulnerability' },
    { pattern: /localStorage\.setItem\s*\(\s*["\'][^"\']*token/, severity: 'high', message: 'Storing tokens in localStorage - use chrome.storage', cws: 'XSS accessible' },
    { pattern: /localStorage\.setItem\s*\(\s*["\'][^"\']*secret/, severity: 'high', message: 'Storing secrets in localStorage', cws: 'Security risk' }
  ],
  contentScript: [
    { pattern: /\$?\(\s*["\'][^"\']*\+.*["\']/, severity: 'high', message: 'Potential DOM XSS in content script', cws: 'Critical security issue' },
    { pattern: /contentScript\.js\s*=/, severity: 'medium', message: 'Dynamic content script injection', cws: 'Review needed' }
  ],
  manifest: [
    { pattern: /"manifest_version"\s*:\s*1/, severity: 'high', message: 'Manifest V1 - deprecated and insecure', cws: 'CWS rejection' },
    { pattern: /"externally_connectable"/, severity: 'low', message: 'externally_connectable - ensure only trusted pages', cws: null }
  ]
};

// src/core.ts
const coreTs = `import * as fs from 'fs';
import * as path from 'path';

const PATTERNS = ${JSON.stringify(securityPatterns)};

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  file: string;
  line: number;
  code: string;
  message: string;
  cwsWarning?: string;
  fix?: string;
}

export interface SecurityReport {
  totalIssues: number;
  bySeverity: { critical: number; high: number; medium: number; low: number };
  byCategory: Record<string, number>;
  issues: SecurityIssue[];
  cwsRejectionRisk: boolean;
  recommendations: string[];
}

function scanFile(filePath: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\\n');
  
  for (const [category, patterns] of Object.entries(PATTERNS)) {
    for (const p of patterns as any[]) {
      const regex = new RegExp(p.pattern, 'gi');
      let match;
      while ((match = regex.exec(content)) !== null) {
        // Find line number
        const beforeMatch = content.substring(0, match.index);
        const lineNum = beforeMatch.split('\\n').length;
        
        // Get surrounding code
        const line = lines[lineNum - 1]?.trim() || '';
        
        issues.push({
          severity: p.severity,
          category,
          file: path.basename(filePath),
          line: lineNum,
          code: line.substring(0, 80),
          message: p.message,
          cwsWarning: p.cws,
          fix: getFix(category, p.pattern as string)
        });
      }
    }
  }
  
  return issues;
}

function getFix(category: string, pattern: string): string | undefined {
  if (pattern.includes('innerHTML')) return 'Use element.textContent = "..." or DOMPurify.sanitize()';
  if (pattern.includes('document.write')) return 'Use document.createElement() and appendChild()';
  if (pattern.includes('eval')) return 'Use JSON.parse() for data, or Function() with extreme caution';
  if (pattern.includes('localStorage')) return 'Use chrome.storage instead - encrypted at rest';
  if (pattern.includes('<all_urls>')) return 'Use activeTab permission for user-initiated access';
  return undefined;
}

export function auditExtension(extensionPath: string): SecurityReport {
  const issues: SecurityIssue[] = [];
  
  function walkDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        walkDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts') || entry.name.endsWith('.html') || entry.name.endsWith('.json'))) {
        try {
          issues.push(...scanFile(fullPath));
        } catch (e) {
          // Skip binary or unreadable files
        }
      }
    }
  }
  
  walkDir(extensionPath);
  
  // Deduplicate issues
  const unique = issues.filter((issue, index, self) =>
    index === self.findIndex((i) => i.file === issue.file && i.line === issue.line && i.message === issue.message)
  );
  
  // Calculate stats
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  const byCategory: Record<string, number> = {};
  
  for (const issue of unique) {
    bySeverity[issue.severity]++;
    byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
  }
  
  const cwsRejectionRisk = bySeverity.critical > 0 || bySeverity.high > 2;
  
  const recommendations: string[] = [];
  if (bySeverity.critical > 0) {
    recommendations.push('CRITICAL: Fix all critical issues before publishing');
  }
  if (issues.some(i => i.category === 'xss')) {
    recommendations.push('Use DOMPurify to sanitize user input before rendering');
  }
  if (issues.some(i => i.category === 'storage')) {
    recommendations.push('Use chrome.storage.session for sensitive data - it\\'s cleared on restart');
  }
  if (bySeverity.high > 0) {
    recommendations.push('Review all high-severity issues - they may cause CWS rejection');
  }
  
  return {
    totalIssues: unique.length,
    bySeverity,
    byCategory,
    issues: unique.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    }),
    cwsRejectionRisk,
    recommendations
  };
}

export function formatReport(report: SecurityReport): string {
  const severityIcon = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
  
  let output = \`🔒 SECURITY AUDIT

📊 SUMMARY
─────────────────────────────────────────────────────────────────
  Total Issues:       \${report.totalIssues}
  🔴 Critical:        \${report.bySeverity.critical}
  🟠 High:            \${report.bySeverity.high}
  🟡 Medium:          \${report.bySeverity.medium}
  🟢 Low:             \${report.bySeverity.low}

  ❌ CWS Rejection Risk: \${report.cwsRejectionRisk ? 'HIGH' : 'LOW'}

\${report.issues.map(i => \`
\${severityIcon[i.severity]} [\${i.severity.toUpperCase()}] \${i.category}
   📁 \${i.file}:\${i.line}
   \${i.code}
   → \${i.message}\${i.fix ? \`
   💡 Fix: \${i.fix}\` : ''}\${i.cwsWarning ? \`
   ⚠️ CWS: \${i.cwsWarning}\` : ''}\`).join('')}
\`;
  
  if (report.recommendations.length > 0) {
    output += \`
💡 RECOMMENDATIONS
─────────────────────────────────────────────────────────────────
\${report.recommendations.map(r => \`  • \${r}\`).join('\\n')}\`;
  }
  
  return output;
}
`;
fs.writeFileSync(path.join(projectRoot, 'src/core.ts'), coreTs);

// src/cli.ts
const cliTs = `import { Command } from 'commander';
import { auditExtension, formatReport } from './core';

const program = new Command();

program
  .name('crx-security-audit')
  .description('Find security issues in Chrome extension code')
  .version('1.0.0')
  .argument('<path>', 'Path to extension directory')
  .option('-o, --output <file>', 'Output JSON report')
  .action((extPath: string, opts: any) => {
    const report = auditExtension(extPath);
    console.log(formatReport(report));
    if (opts.output) {
      fs.writeFileSync(opts.output, JSON.stringify(report, null, 2));
    }
    process.exit(report.cwsRejectionRisk ? 1 : 0);
  });

program.parse();
`;
fs.writeFileSync(path.join(projectRoot, 'src/cli.ts'), cliTs);

// src/index.ts
fs.writeFileSync(path.join(projectRoot, 'src/index.ts'), `export { auditExtension, formatReport, SecurityReport, SecurityIssue } from './core';`);

// tsconfig.json
fs.writeFileSync(path.join(projectRoot, 'tsconfig.json'), JSON.stringify({
  compilerOptions: { target: "ES2020", module: "commonjs", outDir: "./dist", strict: true, esModuleInterop: true },
  include: ["src/**/*"]
}, null, 2));

// README.md
fs.writeFileSync(path.join(projectRoot, 'README.md'), `# @zovo/crx-security-audit

Find security issues in Chrome extension code - XSS, CSP, storage, and more.

## Usage

\`\`\`bash
npx crx-security-audit ./my-extension
\`\`\`

## Checks

- **XSS**: innerHTML, eval, document.write, inline handlers
- **CSP**: unsafe-inline, unsafe-eval, wildcards
- **Storage**: passwords/tokens in localStorage
- **Permissions**: overreaching host permissions
- **Content Scripts**: DOM XSS patterns

## Example

\`\`\`
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
\`\`\`
`);

// Test fixture
fs.mkdirSync(path.join(projectRoot, 'tests/fixtures/vuln-extension'), { recursive: true });
fs.writeFileSync(path.join(projectRoot, 'tests/fixtures/vuln-extension/manifest.json'), JSON.stringify({
  manifest_version: 3,
  name: "Vulnerable",
  version: "1.0.0",
  background: { service_worker: "bg.js" },
  permissions: ["<all_urls>"]
}, null, 2));
const bgContent = `// Critical
eval('console.log("test")');

// High - XSS
document.getElementById('app').innerHTML = userInput;

// High - Storage
localStorage.setItem('token', 'secret123');

// Medium - CSP
const script = document.createElement('script');
script.src = 'javascript:alert(1)';
`;
fs.writeFileSync(path.join(projectRoot, 'tests/fixtures/vuln-extension/bg.js'), bgContent);

console.log('✅ crx-security-audit built successfully');
