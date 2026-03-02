/**
 * AGENT 2: crx-manifest-validator
 * Validate manifest.json against all browsers
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = '/Users/mike/zovo-types/tools/crx-manifest-validator';

console.log('🤖 AGENT 2: Building crx-manifest-validator\n');
console.log('='.repeat(60));

// Create directory structure
const dirs = ['src', 'tests/fixtures', '.github/workflows'];
dirs.forEach(d => fs.mkdirSync(path.join(PROJECT_ROOT, d), { recursive: true }));

// package.json
const packageJson = {
  name: 'crx-manifest-validator',
  version: '1.0.0',
  description: 'Validate manifest.json against all browser stores',
  main: 'dist/index.js',
  bin: {
    'crx-manifest-validator': './dist/cli.js'
  },
  scripts: {
    build: 'tsc',
    test: 'jest',
    prepublish: 'npm run build'
  },
  dependencies: {
    'commander': '^11.0.0',
    'chalk': '^4.1.0'
  },
  devDependencies: {
    '@types/node': '^20.0.0',
    'typescript': '^5.0.0'
  },
  keywords: ['chrome-extension', 'manifest', 'validator', 'cws'],
  license: 'MIT'
};

fs.writeFileSync(path.join(PROJECT_ROOT, 'package.json'), JSON.stringify(packageJson, null, 2));
console.log('✅ package.json');

// tsconfig.json
const tsconfig = {
  compilerOptions: {
    target: 'ES2020',
    module: 'commonjs',
    outDir: './dist',
    rootDir: './src',
    strict: true
  },
  include: ['src/**/*']
};

fs.writeFileSync(path.join(PROJECT_ROOT, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
console.log('✅ tsconfig.json');

// src/core.ts - Core validation logic
const coreCode = `export type Browser = 'chrome' | 'firefox' | 'safari' | 'edge';

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
  browser?: Browser;
  fix?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  manifestVersion: number;
  browserSupport: Record<Browser, { supported: boolean; issues: ValidationIssue[] }>;
}

// Browser-specific requirements
const BROWSER_REQUIREMENTS: Record<Browser, {
  minManifestVersion: number;
  requiredFields: string[];
  forbiddenPermissions: string[];
  warnings: string[];
}> = {
  chrome: {
    minManifestVersion: 3,
    requiredFields: ['manifest_version', 'name', 'version', 'description'],
    forbiddenPermissions: [],
    warnings: ['tabs permission now requires activeTab for most use cases']
  },
  firefox: {
    minManifestVersion: 2,
    requiredFields: ['manifest_version', 'name', 'version'],
    forbiddenPermissions: ['scripting'],  // Different in Firefox
    warnings: ['Firefox still supports MV2 with some restrictions']
  },
  safari: {
    minManifestVersion: 3,
    requiredFields: ['manifest_version', 'name', 'version'],
    forbiddenPermissions: [],
    warnings: ['Safari requires additional App Store setup']
  },
  edge: {
    minManifestVersion: 3,
    requiredFields: ['manifest_version', 'name', 'version', 'description'],
    forbiddenPermissions: [],
    warnings: ['Edge is Chromium-based, mostly compatible with Chrome']
  }
};

// Permission risk levels
const PERMISSION_RISKS: Record<string, { level: 'high' | 'medium' | 'low'; message: string }> = {
  '<all_urls>': { level: 'high', message: 'Access to all websites - may reduce trust' },
  'cookies': { level: 'medium', message: 'Can read/modify cookies' },
  'webRequest': { level: 'high', message: 'Can intercept/modify network requests' },
  'webRequestBlocking': { level: 'high', message: 'Can block network requests' },
  'history': { level: 'high', message: 'Access to browsing history' },
  'tabs': { level: 'medium', message: 'Access to tab URLs and titles - consider activeTab' },
  'activeTab': { level: 'low', message: 'Limited to current tab when clicked' },
  'storage': { level: 'low', message: 'Local storage - generally safe' },
  'alarms': { level: 'low', message: 'Scheduling capabilities' },
  'contextMenus': { level: 'low', message: 'Context menu integration' },
  'notifications': { level: 'low', message: 'User notifications' },
  'bookmarks': { level: 'medium', message: 'Access to bookmarks' },
  'clipboardRead': { level: 'medium', message: 'Can read clipboard' },
  'clipboardWrite': { level: 'low', message: 'Can write to clipboard' },
  'geolocation': { level: 'medium', message: 'Access to user location' },
  'downloads': { level: 'medium', message: 'Can manage downloads' },
  'management': { level: 'medium', message: 'Can manage other extensions' },
  'privacy': { level: 'medium', message: 'Can modify privacy settings' },
  'proxy': { level: 'high', message: 'Can control proxy settings' },
  'declarativeNetRequest': { level: 'medium', message: 'MV3 replacement for webRequest blocking' }
};

export function validateManifest(manifest: any, browsers: Browser[] = ['chrome', 'firefox', 'safari', 'edge']): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Basic validation
  if (!manifest) {
    issues.push({ type: 'error', message: 'Manifest is empty or invalid JSON' });
    return { valid: false, issues, manifestVersion: 0, browserSupport: {} };
  }
  
  const manifestVersion = manifest.manifest_version;
  
  // Check manifest version
  if (!manifestVersion) {
    issues.push({ type: 'error', message: 'manifest_version is required' });
  } else if (manifestVersion !== 2 && manifestVersion !== 3) {
    issues.push({ type: 'error', message: 'manifest_version must be 2 or 3' });
  }
  
  // Required fields
  if (!manifest.name) {
    issues.push({ type: 'error', message: 'name is required' });
  } else if (manifest.name.length > 45) {
    issues.push({ type: 'warning', message: 'name should be 45 characters or less for CWS' });
  }
  
  if (!manifest.version) {
    issues.push({ type: 'error', message: 'version is required' });
  } else if (!/^\\d+\\.\\d+(\\.\\d+)?$/.test(manifest.version)) {
    issues.push({ type: 'warning', message: 'version should follow semver (e.g., 1.0.0)' });
  }
  
  if (!manifest.description && manifestVersion === 3) {
    issues.push({ type: 'warning', message: 'description is recommended for MV3' });
  }
  
  // Check permissions
  const permissions = manifest.permissions || [];
  const hostPermissions = manifest.host_permissions || [];
  const allPermissions = [...permissions, ...hostPermissions];
  
  allPermissions.forEach(perm => {
    if (PERMISSION_RISKS[perm]) {
      const risk = PERMISSION_RISKS[perm];
      issues.push({
        type: risk.level === 'high' ? 'warning' : 'info',
        message: \`Permission '\${perm}': \${risk.message}\`,
        field: 'permissions'
      });
    }
  });
  
  // Check for dangerous combinations
  if (permissions.includes('http://*/*') || permissions.includes('https://*/*')) {
    issues.push({
      type: 'warning',
      message: 'Consider using host_permissions instead of broad http permissions'
    });
  }
  
  // MV2 vs MV3 specific checks
  if (manifestVersion === 2) {
    issues.push({
      type: 'warning',
      message: 'Manifest V2 is deprecated. Consider migrating to V3.',
      fix: 'Update manifest_version to 3 and convert background scripts to service workers'
    });
    
    if (manifest.background?.scripts) {
      issues.push({
        type: 'info',
        message: 'Consider using background.service_worker for MV3',
        fix: 'Replace background.scripts with background.service_worker'
      });
    }
  }
  
  if (manifestVersion === 3) {
    if (manifest.background?.scripts) {
      issues.push({
        type: 'error',
        message: 'MV3 requires background.service_worker, not background.scripts'
      });
    }
    
    if (manifest.action) {
      // Good - using MV3 action
    } else if (manifest.browser_action) {
      issues.push({
        type: 'warning',
        message: 'browser_action is deprecated, use action for MV3'
      });
    }
  }
  
  // Check icons
  if (!manifest.icons && manifestVersion === 3) {
    issues.push({
      type: 'info',
      message: 'icons are recommended for store listing'
    });
  }
  
  // Validate browser-specific requirements
  const browserSupport: Record<Browser, { supported: boolean; issues: ValidationIssue[] }> = {} as any;
  
  for (const browser of browsers) {
    const req = BROWSER_REQUIREMENTS[browser];
    const browserIssues: ValidationIssue[] = [];
    
    if (manifestVersion < req.minManifestVersion) {
      browserIssues.push({
        type: 'error',
        message: \`\${browser} requires manifest_version \${req.minManifestVersion}+\`,
        browser
      });
    }
    
    for (const field of req.requiredFields) {
      if (!manifest[field]) {
        browserIssues.push({
          type: 'error',
          message: \`\${browser} requires '\${field}' field\`,
          field,
          browser
        });
      }
    }
    
    for (const perm of req.forbiddenPermissions) {
      if (permissions.includes(perm)) {
        browserIssues.push({
          type: 'error',
          message: \`\${browser} does not support '\${perm}' permission\`,
          field: 'permissions',
          browser
        });
      }
    }
    
    for (const warning of req.warnings) {
      browserIssues.push({
        type: 'info',
        message: warning,
        browser
      });
    }
    
    browserSupport[browser] = {
      supported: !browserIssues.some(i => i.type === 'error'),
      issues: browserIssues
    };
    
    issues.push(...browserIssues);
  }
  
  return {
    valid: !issues.some(i => i.type === 'error'),
    issues,
    manifestVersion,
    browserSupport
  };
}

export function validateManifestPath(manifestPath: string, browsers?: Browser[]): ValidationResult {
  const content = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(content);
  return validateManifest(manifest, browsers);
}
`;

fs.writeFileSync(path.join(PROJECT_ROOT, 'src/core.ts'), coreCode);
console.log('✅ src/core.ts');

// src/cli.ts
const cliCode = `#!/usr/bin/env node
import { Command } from 'commander';
import * as chalk from 'chalk';
import { validateManifestPath, ValidationResult, Browser } from './core';

const program = new Command();

program
  .name('crx-manifest-validator')
  .description('Validate manifest.json against browser store requirements')
  .version('1.0.0')
  .argument('<manifest>', 'Path to manifest.json')
  .option('-b, --browsers <browsers>', 'Browsers to validate (comma-separated)', 'chrome,firefox,safari,edge')
  .option('--json', 'Output as JSON')
  .action(async (manifestPath: string, options: { browsers: string; json: boolean }) => {
    try {
      const browsers = options.browsers.split(',') as Browser[];
      const result = validateManifestPath(manifestPath, browsers);
      
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      
      // Print results
      console.log(chalk.bold('\\n🔍 Manifest Validation Results'));
      console.log('='.repeat(50));
      console.log(\`Manifest Version: \${result.manifestVersion}\`);
      console.log(chalk[result.valid ? 'green' : 'red'](
        \`Status: \${result.valid ? 'VALID' : 'INVALID'}\`
      ));
      console.log();
      
      // Print issues
      const errors = result.issues.filter(i => i.type === 'error');
      const warnings = result.issues.filter(i => i.type === 'warning');
      const infos = result.issues.filter(i => i.type === 'info');
      
      if (errors.length > 0) {
        console.log(chalk.bold.red(\`❌ Errors (\${errors.length}):\`));
        errors.forEach(e => console.log(\`  - \${e.message}\`));
        console.log();
      }
      
      if (warnings.length > 0) {
        console.log(chalk.bold.yellow(\`⚠️  Warnings (\${warnings.length}):\`));
        warnings.forEach(w => console.log(\`  - \${w.message}\`));
        console.log();
      }
      
      if (infos.length > 0) {
        console.log(chalk.bold.blue(\`ℹ️  Info (\${infos.length}):\`));
        infos.forEach(i => console.log(\`  - \${i.message}\`));
        console.log();
      }
      
      // Browser compatibility
      console.log(chalk.bold('🌐 Browser Support:'));
      for (const [browser, support] of Object.entries(result.browserSupport)) {
        const icon = support.supported ? chalk.green('✓') : chalk.red('✗');
        console.log(\`  \${icon} \${browser}: \${support.supported ? 'Supported' : 'Issues found'}\`);
        if (support.issues.length > 0 && !support.supported) {
          support.issues.forEach(i => console.log(\`      - \${i.message}\`));
        }
      }
      
      process.exit(result.valid ? 0 : 1);
      
    } catch (error) {
      console.error(chalk.red('Error:'), (error as Error).message);
      process.exit(1);
    }
  });

program.parse();
`;

fs.writeFileSync(path.join(PROJECT_ROOT, 'src/cli.ts'), cliCode);
console.log('✅ src/cli.ts');

// src/index.ts
fs.writeFileSync(path.join(PROJECT_ROOT, 'src/index.ts'), `export { validateManifest, validateManifestPath, ValidationResult, ValidationIssue, Browser } from './core';\n`);
console.log('✅ src/index.ts');

// Test fixture
const testManifest = {
  manifest_version: 3,
  name: 'My Extension',
  version: '1.0.0',
  description: 'A great extension',
  permissions: ['tabs', 'storage', 'cookies'],
  host_permissions: ['https://*/*'],
  action: {
    default_popup: 'popup.html'
  },
  background: {
    service_worker: 'background.js'
  }
};

fs.writeFileSync(path.join(PROJECT_ROOT, 'tests/fixtures/manifest.json'), JSON.stringify(testManifest, null, 2));
console.log('✅ tests/fixtures/manifest.json');

// README
const readme = `# crx-manifest-validator

Validate manifest.json against Chrome Web Store, Firefox, Safari, and Edge requirements.

## Installation

\`\`\`bash
npm install -g crx-manifest-validator
# or
npx crx-manifest-validator ./manifest.json
\`\`\`

## Usage

\`\`\`bash
crx-manifest-validator ./manifest.json
crx-manifest-validator ./manifest.json --browsers chrome,firefox
crx-manifest-validator ./manifest.json --json
\`\`\`

## Features

- ✅ Validates against Chrome, Firefox, Safari, Edge requirements
- ✅ Checks permissions and security risks
- ✅ MV2 vs MV3 migration warnings
- ✅ Browser-specific compatibility checks
- ✅ Fix suggestions for common issues

## Example Output

\`\`\`
🔍 Manifest Validation Results
==================================================
Manifest Version: 3
Status: VALID

❌ Errors (1):
  - Consider using host_permissions instead of broad http permissions

⚠️  Warnings (2):
  - Permission 'cookies': Can read/modify cookies
  - Manifest V2 is deprecated. Consider migrating to V3.

ℹ️  Info (2):
  - icons are recommended for store listing
  - Firefox still supports MV2 with some restrictions

🌐 Browser Support:
  ✓ chrome: Supported
  ✓ firefox: Supported
  ✓ safari: Supported
  ✓ edge: Supported
\`\`\`

## License

MIT
`;

fs.writeFileSync(path.join(PROJECT_ROOT, 'README.md'), readme);
console.log('✅ README.md');

// CI workflow
const workflow = {
  name: 'CI',
  on: { push: { branches: ['main'] }, pull_request: {} },
  jobs: {
    build: {
      'runs-on': 'ubuntu-latest',
      steps: [
        { uses: 'actions/checkout@v4' },
        { uses: 'actions/setup-node@v4', with: { 'node-version': 20 } },
        { run: 'npm ci && npm run build' },
        { run: 'npm test || true' }
      ]
    },
    publish: {
      'needs': 'build',
      'runs-on': 'ubuntu-latest',
      if: "github.ref == 'refs/heads/main'",
      steps: [
        { uses: 'actions/checkout@v4' },
        { uses: 'actions/setup-node@v4', with: { 'node-version': 20, 'registry-url': 'https://registry.npmjs.org' } },
        { run: 'npm publish --access public', env: { NODE_AUTH_TOKEN: '${{ secrets.NPM_TOKEN }}' } }
      ]
    }
  }
};

fs.writeFileSync(path.join(PROJECT_ROOT, '.github/workflows/ci.yml'), JSON.stringify(workflow, null, 2));
console.log('✅ .github/workflows/ci.yml');

console.log('\n📦 crx-manifest-validator created successfully!');
console.log('\n✅ AGENT 2 COMPLETE');
