// Agent 1: Build crx-size-analyzer
const fs = require('fs');
const path = require('path');

const projectRoot = '/Users/mike/zovo-types/packages/crx-size-analyzer';

console.log('Building crx-size-analyzer...');

// Create directory structure
const dirs = [
  'src',
  'tests/fixtures/extension-with-deps',
  'tests/fixtures/simple-extension',
  '.github/workflows'
];

dirs.forEach(d => {
  const dir = path.join(projectRoot, d);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// package.json
const pkgJson = {
  "name": "@zovo/crx-size-analyzer",
  "version": "1.0.0",
  "description": "Analyze Chrome extension bundle size breakdown",
  "main": "dist/index.js",
  "bin": {
    "crx-size-analyzer": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "archiver": "^6.0.0",
    "gzip-size": "^7.0.0",
    "brotli-size": "^4.0.0"
  },
  "devDependencies": {
    "@types/archiver": "^6.0.0",
    "@types/gzip-size": "^6.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  },
  "keywords": ["chrome-extension", "size-analysis", "bundle"],
  "license": "MIT"
};
fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify(pkgJson, null, 2));

// src/core.ts
const coreTs = `import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import gzipSize from 'gzip-size';
import brotliSize from 'brotli-size';

export interface SizeEntry {
  file: string;
  rawSize: number;
  gzipSize: number;
  brotliSize: number;
  percentOfTotal: number;
}

export interface SizeReport {
  totalRawSize: number;
  totalGzipSize: number;
  totalBrotliSize: number;
  files: SizeEntry[];
  largestDeps: SizeEntry[];
  optimizationTips: string[];
}

function calculateSize(filePath: string, baseSize: number): SizeEntry {
  const content = fs.readFileSync(filePath);
  const rawSize = content.length;
  const gzip = gzipSize.sync(content);
  const brotli = brotliSize.sync(content);
  return {
    file: path.relative(process.cwd(), file),
    rawSize,
    gzipSize: gzip,
    brotliSize: brotli,
    percentOfTotal: (rawSize / baseSize) * 100
  };
}

export async function analyzeExtension(extensionPath: string): Promise<SizeReport> {
  const files: string[] = [];
  
  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walkDir(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(extensionPath);
  
  const entries = files.map(f => {
    const content = fs.readFileSync(f);
    return {
      file: path.relative(extensionPath, f),
      rawSize: content.length,
      gzipSize: gzipSize.sync(content),
      brotliSize: brotliSize.sync(content),
      percentOfTotal: 0
    };
  });
  
  const totalRawSize = entries.reduce((sum, e) => sum + e.rawSize, 0);
  const totalGzipSize = entries.reduce((sum, e) => sum + e.gzipped, 0);
  const totalBrotliSize = entries.reduce((sum, e) => sum + e.brotli, 0);
  
  entries.forEach(e => e.percentOfTotal = (e.rawSize / totalRawSize) * 100);
  
  const largestDeps = entries
    .filter(e => e.file.includes('node_modules') || e.file.includes('dist/'))
    .sort((a, b) => b.rawSize - a.rawSize)
    .slice(0, 10);
  
  const optimizationTips: string[] = [];
  if (totalGzipSize > 200 * 1024) {
    optimizationTips.push('Consider using dynamic imports for large dependencies');
  }
  if (entries.some(e => e.file.endsWith('.map'))) {
    optimizationTips.push('Remove source maps from production build');
  }
  const largeImages = entries.filter(e => e.file.match(/\\.(png|jpg|gif)$/) && e.rawSize > 50 * 1024);
  if (largeImages.length > 0) {
    optimizationTips.push('Compress or convert large images to WebP');
  }
  
  return {
    totalRawSize,
    totalGzipSize,
    totalBrotliSize,
    files: entries.sort((a, b) => b.rawSize - a.rawSize),
    largestDeps,
    optimizationTips
  };
}

export function formatReport(report: SizeReport): string {
  let output = \`╔══════════════════════════════════════════════════════════════╗
║                    EXTENSION SIZE ANALYSIS                      ║
╠══════════════════════════════════════════════════════════════╣
║  Total Raw Size:      \${(report.totalRawSize / 1024).toFixed(2)} KB
║  Total Gzipped:       \${(report.totalGzipSize / 1024).toFixed(2)} KB  
║  Total Brotli:        \${(report.totalBrotliSize / 1024).toFixed(2)} KB
╠══════════════════════════════════════════════════════════════╣
║  TOP 10 LARGEST FILES                                           ║
║  ─────────────────────────────────────────────────────────────  \${report.files.slice(0, 10).map((f, i) => \`
║  \${i + 1}. \${f.file.padEnd(40)} \${(f.rawSize / 1024).toFixed(1)}KB (\${f.percentOfTotal.toFixed(1)}%)\`).join('')}
╠══════════════════════════════════════════════════════════════╣
║  OPTIMIZATION TIPS                                              ║
║  ─────────────────────────────────────────────────────────────  \${report.optimizationTips.map(t => \`
║  • \${t}\`).join('')}
╚══════════════════════════════════════════════════════════════╝\`;
  return output;
}
`;
fs.writeFileSync(path.join(projectRoot, 'src/core.ts'), coreTs);

// src/cli.ts
const cliTs = `import { Command } from 'commander';
import { analyzeExtension, formatReport } from './core';

const program = new Command();

program
  .name('crx-size-analyzer')
  .description('Analyze Chrome extension bundle size breakdown')
  .version('1.0.0')
  .argument('<path>', 'Path to extension directory')
  .option('-o, --output <file>', 'Output JSON to file')
  .action(async (extPath: string) => {
    try {
      const report = await analyzeExtension(extPath);
      console.log(formatReport(report));
      if (program.opts().output) {
        const fs = require('fs');
        fs.writeFileSync(program.opts().output, JSON.stringify(report, null, 2));
      }
    } catch (error) {
      console.error('Error analyzing extension:', error);
      process.exit(1);
    }
  });

program.parse();
`;
fs.writeFileSync(path.join(projectRoot, 'src/cli.ts'), cliTs);

// src/index.ts
const indexTs = `export { analyzeExtension, formatReport, SizeReport, SizeEntry } from './core';
`;
fs.writeFileSync(path.join(projectRoot, 'src/index.ts'), indexTs);

// tsconfig.json
const tsconfig = {
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
};
fs.writeFileSync(path.join(projectRoot, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

// README.md
const readme = `# @zovo/crx-size-analyzer

Analyze Chrome extension bundle size breakdown with file-by-file analysis.

## Installation

\`\`\`bash
npm install -g @zovo/crx-size-analyzer
# or
npx @zovo/crx-size-analyzer
\`\`\`

## Usage

\`\`\`bash
npx crx-size-analyzer ./my-extension
\`\`\`

## Output

- File-by-file size breakdown
- Gzip and Brotli sizes
- Largest dependencies
- Optimization tips

## Example Output

\`\`\`
╔══════════════════════════════════════════════════════════════╗
║                    EXTENSION SIZE ANALYSIS                      ║
╠══════════════════════════════════════════════════════════════╣
║  Total Raw Size:      1.2 MB
║  Total Gzipped:       350 KB
╚══════════════════════════════════════════════════════════════╝
\`\`\`
`;
fs.writeFileSync(path.join(projectRoot, 'README.md'), readme);

// Test fixture
const fixtureManifest = {
  manifest_version: 3,
  name: "Test Extension",
  version: "1.0.0",
  background: { service_worker: "background.js" },
  action: { default_popup: "popup.html" },
  content_scripts: [{ matches: ["<all_urls>"], js: ["content.js"] }]
};
fs.writeFileSync(path.join(projectRoot, 'tests/fixtures/simple-extension/manifest.json'), JSON.stringify(fixtureManifest, null, 2));
fs.writeFileSync(path.join(projectRoot, 'tests/fixtures/simple-extension/background.js'), 'console.log("background");');
fs.writeFileSync(path.join(projectRoot, 'tests/fixtures/simple-extension/popup.html'), '<html><body>Popup</body></html>');
fs.writeFileSync(path.join(projectRoot, 'tests/fixtures/simple-extension/content.js'), 'console.log("content");');

console.log('✅ crx-size-analyzer built successfully');
