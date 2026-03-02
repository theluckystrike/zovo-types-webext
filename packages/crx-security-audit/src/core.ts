import * as fs from 'fs';
import * as path from 'path';

const PATTERNS = {"xss":[{"pattern":{},"severity":"high","message":"innerHTML assignment - use textContent or sanitize","cws":"Potential XSS - will require review"},{"pattern":{},"severity":"high","message":"insertAdjacentHTML - use DOM APIs","cws":"Potential XSS"},{"pattern":{},"severity":"high","message":"document.write - deprecated and unsafe","cws":"CWS rejection risk"},{"pattern":{},"severity":"critical","message":"eval() usage - arbitrary code execution","cws":"CWS rejection likely"},{"pattern":{},"severity":"critical","message":"Function constructor - like eval()","cws":"CWS rejection likely"},{"pattern":{},"severity":"high","message":"javascript: URL in src attribute","cws":"XSS risk"},{"pattern":{},"severity":"medium","message":"Inline event handler - use addEventListener","cws":"Best practice violation"},{"pattern":{},"severity":"medium","message":"Inline error handler","cws":"Best practice violation"},{"pattern":{},"severity":"medium","message":"Inline script tag - use external file","cws":"CSP violation"},{"pattern":{},"severity":"high","message":"React dangerouslySetInnerHTML - ensure sanitization","cws":"Requires code review"}],"csp":[{"pattern":{},"severity":"low","message":"script-src directive","cws":null},{"pattern":{},"severity":"high","message":"unsafe-inline in CSP - weakens security","cws":"Will require justification"},{"pattern":{},"severity":"high","message":"unsafe-eval in CSP - allows eval()","cws":"Strict review required"},{"pattern":{},"severity":"medium","message":"Wildcard in script-src","cws":"Security risk"}],"permissions":[{"pattern":{},"severity":"medium","message":"Access to all URLs - requires strong justification","cws":"Requires prominent disclosure"},{"pattern":{},"severity":"medium","message":"Access to all HTTP sites","cws":"Security concern"},{"pattern":{},"severity":"medium","message":"Access to all HTTPS sites","cws":"Requires disclosure"}],"storage":[{"pattern":{},"severity":"critical","message":"Storing passwords in localStorage","cws":"Security vulnerability"},{"pattern":{},"severity":"high","message":"Storing tokens in localStorage - use chrome.storage","cws":"XSS accessible"},{"pattern":{},"severity":"high","message":"Storing secrets in localStorage","cws":"Security risk"}],"contentScript":[{"pattern":{},"severity":"high","message":"Potential DOM XSS in content script","cws":"Critical security issue"},{"pattern":{},"severity":"medium","message":"Dynamic content script injection","cws":"Review needed"}],"manifest":[{"pattern":{},"severity":"high","message":"Manifest V1 - deprecated and insecure","cws":"CWS rejection"},{"pattern":{},"severity":"low","message":"externally_connectable - ensure only trusted pages","cws":null}]};

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
  const lines = content.split('\n');
  
  for (const [category, patterns] of Object.entries(PATTERNS)) {
    for (const p of patterns as any[]) {
      const regex = new RegExp(p.pattern, 'gi');
      let match;
      while ((match = regex.exec(content)) !== null) {
        // Find line number
        const beforeMatch = content.substring(0, match.index);
        const lineNum = beforeMatch.split('\n').length;
        
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
    recommendations.push('Use chrome.storage.session for sensitive data - it\'s cleared on restart');
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
  
  let output = `🔒 SECURITY AUDIT

📊 SUMMARY
─────────────────────────────────────────────────────────────────
  Total Issues:       ${report.totalIssues}
  🔴 Critical:        ${report.bySeverity.critical}
  🟠 High:            ${report.bySeverity.high}
  🟡 Medium:          ${report.bySeverity.medium}
  🟢 Low:             ${report.bySeverity.low}

  ❌ CWS Rejection Risk: ${report.cwsRejectionRisk ? 'HIGH' : 'LOW'}

${report.issues.map(i => `
${severityIcon[i.severity]} [${i.severity.toUpperCase()}] ${i.category}
   📁 ${i.file}:${i.line}
   ${i.code}
   → ${i.message}${i.fix ? `
   💡 Fix: ${i.fix}` : ''}${i.cwsWarning ? `
   ⚠️ CWS: ${i.cwsWarning}` : ''}`).join('')}
`;
  
  if (report.recommendations.length > 0) {
    output += `
💡 RECOMMENDATIONS
─────────────────────────────────────────────────────────────────
${report.recommendations.map(r => `  • ${r}`).join('\n')}`;
  }
  
  return output;
}
