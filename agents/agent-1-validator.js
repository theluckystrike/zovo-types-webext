/**
 * AGENT 1: API Schema Validator & Quality Assurance
 * Validates all TypeScript definitions for correctness, completeness, and best practices
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = '/Users/mike/zovo-types';
const PACKAGES_DIR = path.join(PROJECT_ROOT, 'packages');

console.log('🤖 AGENT 1: API Schema Validator & Quality Assurance\n');
console.log('=' .repeat(60));

// Quality rules to validate
const qualityRules = {
  requiredHeaders: true,
  strictTyping: true,
  nullableHandling: true,
  callbackPatterns: true,
  promiseReturns: true,
  eventTypes: true,
  permissionAnnotations: true
};

// Results tracking
const validationResults = {
  passed: [],
  warnings: [],
  errors: [],
  fixes: []
};

function validateFile(filePath, packageName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  let issues = [];
  
  // Check 1: Has proper header comment
  if (!content.includes('//') && !content.includes('/*')) {
    issues.push({ type: 'warning', msg: 'Missing file header comment' });
  }
  
  // Check 2: Check for 'any' type usage (anti-pattern)
  const anyTypeMatches = content.match(/:\s*any\b/g);
  if (anyTypeMatches && anyTypeMatches.length > 0) {
    issues.push({ type: 'warning', msg: `Contains ${anyTypeMatches.length} 'any' type(s) - consider strict typing` });
  }
  
  // Check 3: Check for optional parameters without defaults in callbacks
  const optionalWithoutDefault = content.match(/\(\s*\?\s*[a-zA-Z]/g);
  if (optionalWithoutDefault) {
    issues.push({ type: 'info', msg: `Contains optional parameters needing careful handling` });
  }
  
  // Check 4: Promise returns should be generic
  const promiseNonGeneric = content.match(/:\s*Promise\s*\(/g);
  if (promiseNonGeneric) {
    issues.push({ type: 'error', msg: `Contains non-generic Promise<> usage` });
    validationResults.fixes.push({ file: fileName, fix: 'Add generic type to Promise<>' });
  }
  
  // Check 5: Event types should extend chrome.events.Event
  if (content.includes('onClicked') || content.includes('onUpdated') || content.includes('onCreated')) {
    if (!content.includes('chrome.events.Event') && !content.includes('Event<')) {
      issues.push({ type: 'warning', msg: 'Event-like properties should extend chrome.events.Event' });
    }
  }
  
  // Check 6: Permission annotations in JSDoc
  const hasPermissions = content.includes('@requires') || content.includes('@permissions');
  if (!hasPermissions && (filePath.includes('tabs') || filePath.includes('storage') || filePath.includes('cookies'))) {
    issues.push({ type: 'info', msg: 'Consider adding @requires permission annotations' });
  }
  
  // Check 7: Namespace declarations
  if (!content.includes('declare namespace') && !content.includes('export as namespace')) {
    if (content.includes('namespace') && !content.startsWith('//')) {
      // Good - has namespace
    }
  }
  
  // Check 8: Export patterns (includes triple-slash references as valid)
  const hasExports = content.includes('export') || content.includes('declare namespace') || content.includes('/// <reference');
  if (!hasExports) {
    issues.push({ type: 'error', msg: 'File has no exports' });
  }
  
  return issues;
}

function analyzePackage(packageDir) {
  const packageName = path.basename(packageDir);
  const srcDir = path.join(packageDir, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.log(`  ⚠️  No src directory in ${packageName}`);
    return;
  }
  
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.d.ts'));
  console.log(`\n📦 ${packageName}: ${files.length} type files`);
  
  let packageWarnings = 0;
  let packageErrors = 0;
  
  // Skip packages with no namespace files (like types-webext-common when no common APIs exist)
  const namespaceDir = path.join(srcDir, 'namespaces');
  const hasNamespaces = fs.existsSync(namespaceDir) && fs.readdirSync(namespaceDir).length > 0;
  
  if (!hasNamespaces && files.length <= 1) {
    console.log(`   ℹ️  No namespace files - package may be placeholder for future common APIs`);
    return;
  }
  
  files.forEach(file => {
    const filePath = path.join(srcDir, file);
    const issues = validateFile(filePath, packageName);
    
    issues.forEach(issue => {
      if (issue.type === 'warning') packageWarnings++;
      if (issue.type === 'error') packageErrors++;
      
      validationResults[issue.type === 'error' ? 'errors' : issue.type === 'warning' ? 'warnings' : 'passed'].push({
        package: packageName,
        file,
        msg: issue.msg
      });
    });
  });
  
  console.log(`   ✅ ${files.length} files analyzed, ${packageErrors} errors, ${packageWarnings} warnings`);
}

// Run validation on all packages
const packages = fs.readdirSync(PACKAGES_DIR).filter(p => 
  fs.statSync(path.join(PACKAGES_DIR, p)).isDirectory()
);

packages.forEach(pkg => {
  analyzePackage(path.join(PACKAGES_DIR, pkg));
});

// Generate validation report
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed checks: ${validationResults.passed.length}`);
console.log(`⚠️  Warnings: ${validationResults.warnings.length}`);
console.log(`❌ Errors: ${validationResults.errors.length}`);
console.log(`🔧 Auto-fixable: ${validationResults.fixes.length}`);

// Save detailed report
const report = {
  timestamp: new Date().toISOString(),
  rules: qualityRules,
  results: validationResults,
  summary: {
    totalPackages: packages.length,
    totalWarnings: validationResults.warnings.length,
    totalErrors: validationResults.errors.length,
    fixable: validationResults.fixes.length
  }
};

fs.writeFileSync(
  path.join(PROJECT_ROOT, 'quality-validation-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n📄 Report saved to: quality-validation-report.json');

// Generate quality score
const totalChecks = validationResults.passed.length + validationResults.warnings.length + validationResults.errors.length;
const score = totalChecks > 0 ? Math.round((validationResults.passed.length / totalChecks) * 100) : 0;
console.log(`\n🏆 Quality Score: ${score}/100`);

// Suggestions for improvement
console.log('\n💡 IMPROVEMENT SUGGESTIONS:');
if (validationResults.errors.length > 0) {
  console.log('  1. Fix generic Promise declarations');
}
if (validationResults.warnings.length > 10) {
  console.log('  2. Add strict typing to replace any[] types');
  console.log('  3. Add @requires permission annotations');
}
console.log('  4. Add JSDoc comments to all public APIs');
console.log('  5. Add deprecation markers for experimental APIs');

console.log('\n✅ AGENT 1 COMPLETE: Quality validation finished');
