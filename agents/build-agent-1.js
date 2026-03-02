/**
 * AGENT 1: crx-size-analyzer
 * Analyze extension bundle size breakdown
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = '/Users/mike/zovo-types/tools/crx-size-analyzer';

console.log('🤖 AGENT 1: Building crx-size-analyzer\n');
console.log('='.repeat(60));

// Create directory structure
const dirs = ['src', 'tests/fixtures', '.github/workflows'];
dirs.forEach(d => fs.mkdirSync(path.join(PROJECT_ROOT, d), { recursive: true }));

// package.json
const packageJson = {
  name: 'crx-size-analyzer',
  version: '1.0.0',
  description: 'Analyze browser extension bundle size breakdown',
  main: 'dist/index.js',
  bin: {
    'crx-size-analyzer': './dist/cli.js'
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
    'typescript': '^5.0.0',
    'jest': '^29.0.0',
    '@types/jest': '^29.0.0'
  },
  keywords: ['chrome-extension', 'size-analysis', 'bundle', 'crx'],
  license: 'MIT'
};

fs.writeFileSync(path.join(PROJECT_ROOT, 'package.json'), JSON.stringify(packageJson, null, 2));
console.log('✅ package.json');

// tsconfig.json
const tsconfig = {
  compilerOptions: {
    target: 'ES2020',
    module: 'commonjs',
    lib: ['ES2020'],
    outDir: './dist',
    rootDir: './src',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true
  },
  include: ['src/**/*']
};

fs.writeFileSync(path.join(PROJECT_ROOT, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
console.log('✅ tsconfig.json');

// src/core.ts - Core logic
const coreCode = `import * as fs from 'fs';
import * as path from 'path';

export interface FileAnalysis {
  name: string;
  size: number;
  sizeFormatted: string;
  percentage: number;
  type: 'js' | 'css' | 'html' | 'image' | 'json' | 'other';
}

export interface SizeAnalysis {
  totalSize: number;
  totalSizeFormatted: string;
  fileCount: number;
  files: FileAnalysis[];
  byType: Record<string, { count: number; size: number }>;
  largestDeps: { name: string; size: number }[];
  optimizationTips: string[];
}

function getFileType(filename: string): FileAnalysis['type'] {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.js') return 'js';
  if (ext === '.css') return 'css';
  if (ext === '.html') return 'html';
  if (['.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp'].includes(ext)) return 'image';
  if (ext === '.json') return 'json';
  return 'other';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeExtension(extensionPath: string): SizeAnalysis {
  const files: FileAnalysis[] = [];
  let totalSize = 0;
  
  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else {
        const stats = fs.statSync(fullPath);
        const size = stats.size;
        totalSize += size;
        
        const relativePath = path.relative(extensionPath, fullPath);
        files.push({
          name: relativePath,
          size,
          sizeFormatted: formatBytes(size),
          percentage: 0,
          type: getFileType(entry.name)
        });
      }
    }
  }
  
  // Get all files in extension
  const manifestPath = path.join(extensionPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Not a valid extension: manifest.json not found');
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  
  // Check for background scripts
  if (manifest.background?.scripts) {
    manifest.background.scripts.forEach((script: string) => {
      const scriptPath = path.join(extensionPath, script);
      if (fs.existsSync(scriptPath)) {
        walkDir(path.dirname(scriptPath));
      }
    });
  }
  
  // Check for content scripts
  if (manifest.content_scripts) {
    manifest.content_scripts.forEach((cs: any) => {
      (cs.js || []).forEach((script: string) => {
        const scriptPath = path.join(extensionPath, script);
        if (fs.existsSync(scriptPath)) {
          walkDir(path.dirname(scriptPath));
        }
      });
    });
  }
  
  // Also scan the entire extension directory
  walkDir(extensionPath);
  
  // Calculate percentages
  files.forEach(f => {
    f.percentage = totalSize > 0 ? (f.size / totalSize) * 100 : 0;
  });
  
  // Sort by size descending
  files.sort((a, b) => b.size - a.size);
  
  // Group by type
  const byType: Record<string, { count: number; size: number }> = {};
  files.forEach(f => {
    if (!byType[f.type]) {
      byType[f.type] = { count: 0, size: 0 };
    }
    byType[f.type].count++;
    byType[f.type].size += f.size;
  });
  
  // Detect common dependencies
  const depPatterns: Record<string, string[]> = {
    'react': ['react.production.min.js', 'react.development.js'],
    'react-dom': ['react-dom.production.min.js'],
    'vue': ['vue.runtime.esm.js', 'vue.js'],
    'angular': ['angular.js', 'angular.min.js'],
    'lodash': ['lodash.js', 'lodash.min.js'],
    'moment': ['moment.js', 'moment.min.js'],
    'chart.js': ['chart.js', 'chart.min.js'],
    'd3': ['d3.js', 'd3.min.js']
  };
  
  const largestDeps: { name: string; size: number }[] = [];
  files.forEach(f => {
    for (const [dep, patterns] of Object.entries(depPatterns)) {
      if (patterns.some(p => f.name.toLowerCase().includes(p.toLowerCase()))) {
        largestDeps.push({ name: dep, size: f.size });
      }
    }
  });
  
  // Generate optimization tips
  const optimizationTips: string[] = [];
  
  if (byType['js']?.size > 1024 * 1024) {
    optimizationTips.push('⚠️ JavaScript bundle exceeds 1MB. Consider code splitting or lazy loading.');
  }
  
  if (byType['image']?.size > 512 * 1024) {
    optimizationTips.push('⚠️ Images exceed 512KB. Consider compressing or using WebP.');
  }
  
  if (files.some(f => f.name.includes('.min.') === false && f.type === 'js' && f.size > 50 * 1024)) {
    optimizationTips.push('💡 Consider minifying unminified JavaScript files.');
  }
  
  if (files.some(f => f.name.includes('lodash') || f.name.includes('moment'))) {
    optimizationTips.push('💡 Consider using lodash-es or date-fns for smaller bundle size.');
  }
  
  if (files.some(f => f.name.includes('react') && !f.name.includes('.min.'))) {
    optimizationTips.push('💡 Use production builds of React (react.production.min.js).');
  }
  
  if (totalSize > 10 * 1024 * 1024) {
    optimizationTips.push('⚠️ Total extension size exceeds 10MB. Chrome Web Store limit is 10MB per user.');
  }
  
  return {
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    fileCount: files.length,
    files,
    byType,
    largestDeps,
    optimizationTips
  };
}

export { analyzeExtension, formatBytes };
`;

fs.writeFileSync(path.join(PROJECT_ROOT, 'src/core.ts'), coreCode);
console.log('✅ src/core.ts');

// src/cli.ts - CLI entry point
const cliCode = `#!/usr/bin/env node
import { Command } from 'commander';
import * as chalk from 'chalk';
import { analyzeExtension, formatBytes, SizeAnalysis } from './core';

const program = new Command();

program
  .name('crx-size-analyzer')
  .description('Analyze browser extension bundle size breakdown')
  .version('1.0.0')
  .argument('<path>', 'Path to extension directory')
  .option('-t, --top <number>', 'Number of top files to show', '10')
  .option('--json', 'Output as JSON')
  .action(async (extensionPath: string, options: { top: string; json: boolean }) => {
    try {
      const analysis = analyzeExtension(extensionPath);
      
      if (options.json) {
        console.log(JSON.stringify(analysis, null, 2));
        return;
      }
      
      // Print summary
      console.log(chalk.bold\\n('📦 Extension Size Analysis'));
      console.log('='.repeat(50));
      console.log(chalk.green('Total Size:') + ' ' + chalk.bold(analysis.totalSizeFormatted));
      console.log(chalk.green('Files:') + ' ' + analysis.fileCount);
      console.log();
      
      // Print largest files
      const topN = parseInt(options.top);
      console.log(chalk.bold('🔝 Largest Files:'));
      analysis.files.slice(0, topN).forEach((file, i) => {
        const bar = '█'.repeat(Math.min(Math.ceil(file.percentage), 30));
        console.log(\`  \${i + 1}. \${file.name}\`);
        console.log(\`     \${file.sizeFormatted} (\${file.percentage.toFixed(1)}%) \${chalk.gray(bar)}\`);
      });
      console.log();
      
      // Print by type
      console.log(chalk.bold('📊 Size by Type:'));
      for (const [type, data] of Object.entries(analysis.byType)) {
        console.log(\`  \${type.toUpperCase()}: \${data.count} files, \${formatBytes(data.size)}\`);
      }
      console.log();
      
      // Print optimization tips
      if (analysis.optimizationTips.length > 0) {
        console.log(chalk.bold('💡 Optimization Tips:'));
        analysis.optimizationTips.forEach(tip => {
          console.log('  ' + tip);
        });
      }
      
    } catch (error) {
      console.error(chalk.red('Error:'), (error as Error).message);
      process.exit(1);
    }
  });

program.parse();
`;

fs.writeFileSync(path.join(PROJECT_ROOT, 'src/cli.ts'), cliCode);
console.log('✅ src/cli.ts');

// src/index.ts - Library exports
const indexCode = `export { analyzeExtension, formatBytes, SizeAnalysis, FileAnalysis } from './core';
export { default as cli } from './cli';
`;

fs.writeFileSync(path.join(PROJECT_ROOT, 'src/index.ts'), indexCode);
console.log('✅ src/index.ts');

// Test fixture
const testManifest = {
  manifest_version: 3,
  name: 'Test Extension',
  version: '1.0',
  background: {
    service_worker: 'background.js'
  }
};

fs.writeFileSync(path.join(PROJECT_ROOT, 'tests/fixtures/manifest.json'), JSON.stringify(testManifest, null, 2));
console.log('✅ tests/fixtures/manifest.json');

// README.md
const readme = `# crx-size-analyzer

Analyze browser extension bundle size breakdown.

## Installation

\`\`\`bash
npm install -g crx-size-analyzer
# or
npx crx-size-analyzer ./my-extension
\`\`\`

## Usage

\`\`\`bash
crx-size-analyzer ./my-extension
crx-size-analyzer ./my-extension --top 20
crx-size-analyzer ./my-extension --json
\`\`\`

## Output

- Total size and file count
- Largest files with percentage bars
- Size breakdown by file type (JS, CSS, images, etc.)
- Optimization tips based on analysis

## Example Output

\`\`\`
📦 Extension Size Analysis
==================================================
Total Size: 2.5 MB
Files: 45

🔝 Largest Files:
  1. vendor.js
     1.2 MB (48.0%) ████████████████████████████████
  2. bundle.js
     800 KB (32.0%) ████████████████████
  3. styles.css
     200 KB (8.0%)  ██████

📊 Size by Type:
  JS: 32 files, 2.1 MB
  CSS: 5 files, 250 KB
  IMAGES: 8 files, 150 KB

💡 Optimization Tips:
  💡 Consider using lodash-es for smaller bundle size.
  ⚠️ Total extension size exceeds 10MB.
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
        { run: 'npm ci' },
        { run: 'npm run build' },
        { run: 'npm test' }
      ]
    },
    publish: {
      'needs': 'build',
      'runs-on': 'ubuntu-latest',
      if: "github.ref == 'refs/heads/main'",
      steps: [
        { uses: 'actions/checkout@v4' },
        { uses: 'actions/setup-node@v4', with: { 'node-version': 20, 'registry-url': 'https://registry.npmjs.org' } },
        { run: 'npm ci' },
        { run: 'npm run build' },
        { run: 'npm publish --access public', env: { NODE_AUTH_TOKEN: '${{ secrets.NPM_TOKEN }}' } }
      ]
    }
  }
};

fs.writeFileSync(
  path.join(PROJECT_ROOT, '.github/workflows/ci.yml'),
  JSON.stringify(workflow, null, 2)
);
console.log('✅ .github/workflows/ci.yml');

console.log('\n📦 crx-size-analyzer created successfully!');
console.log('\n📊 Summary:');
console.log('   - 4 source files');
console.log('   - Test fixtures');
console.log('   - CI workflow');
console.log('   - README documentation');
console.log('\n✅ AGENT 1 COMPLETE');
