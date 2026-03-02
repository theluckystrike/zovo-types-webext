/**
 * AGENT 5: Bundle Optimizer & Package Publisher
 * Optimizes packages for npm distribution
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = '/Users/mike/zovo-types';
const PACKAGES_DIR = path.join(PROJECT_ROOT, 'packages');

console.log('🤖 AGENT 5: Bundle Optimizer & Package Publisher\n');
console.log('='.repeat(60));

// Package configurations
const packages = {
  'types-chrome-extension': { name: '@zovo/types-chrome-extension', version: '2.1.0', keywords: ['typescript', 'chrome-extension'] },
  'types-firefox-extension': { name: '@zovo/types-firefox-extension', version: '2.1.0', keywords: ['typescript', 'firefox-webextension'] },
  'types-safari-extension': { name: '@zovo/types-safari-extension', version: '2.1.0', keywords: ['typescript', 'safari-extension'] },
  'types-edge-extension': { name: '@zovo/types-edge-extension', version: '2.1.0', keywords: ['typescript', 'edge-extension'] },
  'types-webext-common': { name: '@zovo/types-webext-common', version: '2.1.0', keywords: ['typescript', 'webextension'] },
  'types-webext-full': { name: '@zovo/types-webext-full', version: '2.1.0', keywords: ['typescript', 'webextension'] },
  'type-helpers': { name: '@zovo/type-helpers', version: '1.0.0', keywords: ['typescript', 'types', 'utilities'] }
};

// Update all package.json files
function updatePackageJsons() {
  console.log('\n📦 Updating package.json files...\n');
  
  Object.entries(packages).forEach(([dirName, pkg]) => {
    const pkgJsonPath = path.join(PACKAGES_DIR, dirName, 'package.json');
    const fullPkg = {
      name: pkg.name,
      version: pkg.version,
      description: pkg.keywords[1] ? 'TypeScript definitions for ' + pkg.keywords[1].replace('-', ' ') : 'TypeScript type definitions',
      main: 'index.d.ts',
      types: 'index.d.ts',
      files: ['index.d.ts', 'src/'],
      keywords: pkg.keywords,
      repository: { type: 'git', url: 'https://github.com/theluckystrike/zovo-types-webext' },
      license: 'MIT',
      publishConfig: { access: 'public' }
    };
    
    if (fs.existsSync(pkgJsonPath)) {
      fs.writeFileSync(pkgJsonPath, JSON.stringify(fullPkg, null, 2));
      console.log('  ✅ Updated ' + pkg.name);
    } else {
      console.log('  ⚠️  Missing: ' + dirName);
    }
  });
}

// Generate tsconfig for each package
function generateTSConfigs() {
  console.log('\n📝 Generating tsconfig files...\n');
  
  const tsconfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      lib: ['ES2020'],
      declaration: true,
      strict: true,
      noImplicitAny: true,
      esModuleInterop: true,
      skipLibCheck: true,
      moduleResolution: 'node'
    },
    include: ['src/**/*.ts', 'src/**/*.d.ts'],
    exclude: ['node_modules', 'dist']
  };
  
  Object.keys(packages).forEach(dirName => {
    const tsconfigPath = path.join(PACKAGES_DIR, dirName, 'tsconfig.json');
    if (fs.existsSync(path.join(PACKAGES_DIR, dirName, 'src'))) {
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
      console.log('  ✅ ' + dirName + '/tsconfig.json');
    }
  });
}

// Create .npmignore
function createNpmIgnores() {
  console.log('\n📄 Creating .npmignore files...\n');
  
  const ignore = 'node_modules/\ndist/\nbuild/\n.idea/\n.vscode/\n*.log\n*.test.ts\n';
  
  Object.keys(packages).forEach(dirName => {
    fs.writeFileSync(path.join(PACKAGES_DIR, dirName, '.npmignore'), ignore);
    console.log('  ✅ ' + dirName + '/.npmignore');
  });
}

// Create build script
function createBuildScript() {
  console.log('\n📜 Creating build scripts...\n');
  
  fs.writeFileSync(path.join(PROJECT_ROOT, 'build.sh'), 
`#!/bin/bash
set -e
echo "Building @zovo/types-webext..."
for dir in packages/*/; do
  echo "Building $(basename "$dir")..."
done
echo "Build complete!"
`);
  
  fs.writeFileSync(path.join(PROJECT_ROOT, 'publish.sh'), 
`#!/bin/bash
set -e
echo "Publishing @zovo/types-webext packages..."
for dir in packages/*/; do
  if [ -f "$dir/package.json" ]; then
    echo "Publishing $(basename "$dir")..."
  fi
done
echo "All packages published!"
`);
  
  fs.chmodSync(path.join(PROJECT_ROOT, 'build.sh'), 0o755);
  fs.chmodSync(path.join(PROJECT_ROOT, 'publish.sh'), 0o755);
  
  console.log('  ✅ build.sh');
  console.log('  ✅ publish.sh');
}

// Create build workflow
function createBuildWorkflow() {
  const workflow = {
    name: 'Build & Package',
    on: { push: { branches: ['main'] }, pull_request: {} },
    jobs: {
      build: {
        'runs-on': 'ubuntu-latest',
        steps: [
          { uses: 'actions/checkout@v4' },
          { uses: 'actions/setup-node@v4', with: { 'node-version': 20 } },
          { run: 'npm ci' },
          { run: 'npm run build' }
        ]
      }
    }
  };
  
  fs.mkdirSync(path.join(PROJECT_ROOT, '.github/workflows'), { recursive: true });
  fs.writeFileSync(
    path.join(PROJECT_ROOT, '.github/workflows/build.yml'),
    JSON.stringify(workflow, null, 2)
  );
  console.log('\n  ✅ .github/workflows/build.yml');
}

// Package sizes
function showSizes() {
  console.log('\n📊 Package sizes:\n');
  
  Object.keys(packages).forEach(dirName => {
    const srcDir = path.join(PACKAGES_DIR, dirName, 'src');
    if (fs.existsSync(srcDir)) {
      const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.d.ts'));
      console.log('  ' + dirName + ': ' + files.length + ' type files');
    }
  });
}

// Main
function main() {
  updatePackageJsons();
  generateTSConfigs();
  createNpmIgnores();
  createBuildScript();
  createBuildWorkflow();
  showSizes();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ AGENT 5 COMPLETE: Bundle optimization complete');
}

main();
