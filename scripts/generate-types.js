/**
 * @zovo/types-monorepo - TypeScript Definition Generator
 * Generates TypeScript definitions for all browser extension types
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const API_CACHE_DIR = path.join(PROJECT_ROOT, 'api-cache');
const NORMALIZED_DIR = path.join(API_CACHE_DIR, 'normalized');
const PACKAGES_DIR = path.join(PROJECT_ROOT, 'packages');
const PACKAGE_JSON = require(path.join(PROJECT_ROOT, 'package.json'));

// Ensure packages directories exist
const packages = [
  'types-chrome-extension',
  'types-firefox-extension', 
  'types-safari-extension',
  'types-edge-extension',
  'types-webext-common',
  'types-webext-full'
];

packages.forEach(pkg => {
  const pkgDir = path.join(PACKAGES_DIR, pkg, 'src', 'namespaces');
  if (!fs.existsSync(pkgDir)) {
    fs.mkdirSync(pkgDir, { recursive: true });
  }
});

/**
 * Generate TypeScript type from normalized type definition
 */
function generateType(type, indent = '  ') {
  if (type.enum) {
    return type.enum.map(e => `'${e}'`).join(' | ');
  }
  if (type.union) {
    return type.union.join(' | ');
  }
  if (type.properties && type.properties.length > 0) {
    const props = type.properties.map(p => {
      const optional = p.optional ? '?' : '';
      return `${indent}${p.name}${optional}: ${p.type};`;
    }).join('\n');
    return `{\n${props}\n${indent.slice(0, -2)}}`;
  }
  return type.type || 'any';
}

/**
 * Generate function signature
 */
function generateFunction(fn, indent = '  ') {
  const params = fn.parameters.map(p => {
    const optional = p.optional ? '?' : '';
    return `${p.name}${optional}: ${p.type}`;
  }).join(', ');
  
  const returns = fn.returns || 'void';
  const asyncPrefix = fn.async ? 'Promise<' : '';
  const asyncSuffix = fn.async ? '>' : '';
  
  return `${fn.name}(${params}): ${asyncPrefix}${returns}${asyncSuffix}`;
}

/**
 * Generate namespace TypeScript file
 */
function generateNamespaceFile(api, browser) {
  const ns = api.namespace.replace(/^browser\./, '');
  const browserPrefix = browser === 'firefox' ? 'browser' : 'chrome';
  
  let content = `/**\n * ${api.description}\n`;
  content += ` * Browser: ${browser}\n`;
  if (api.compatibility) {
    content += ` * Compatibility: ${JSON.stringify(api.compatibility)}\n`;
  }
  content += ` * Source: ${api.source}\n`;
  content += ` */\n\n`;
  
  content += `declare namespace ${browserPrefix}.${ns} {\n`;
  
  // Types
  if (api.types && api.types.length > 0) {
    content += `  // Types\n`;
    api.types.forEach(type => {
      content += `  type ${type.name} = ${generateType(type)};\n`;
    });
    content += '\n';
  }
  
  // Functions
  if (api.functions && api.functions.length > 0) {
    content += `  // Functions\n`;
    api.functions.forEach(fn => {
      content += `  function ${generateFunction(fn, '  ')};\n`;
    });
    content += '\n';
  }
  
  // Events
  if (api.events && api.events.length > 0) {
    content += `  // Events\n`;
    api.events.forEach(event => {
      content += `  const on${capitalize(event.name)}: {\n`;
      content += `    addListener(callback: (${event.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}) => void): void;\n`;
      content += `    removeListener(callback: (${event.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}) => void): void;\n`;
      content += `  };\n`;
    });
  }
  
  content += `}\n`;
  
  return content;
}

/**
 * Generate Chrome Extension types
 */
function generateChromeTypes(normalized) {
  console.log('  → Generating Chrome Extension types...');
  
  const chromeDir = path.join(PACKAGES_DIR, 'types-chrome-extension', 'src', 'namespaces');
  
  // Generate individual namespace files
  normalized.chrome.forEach(api => {
    const ns = api.namespace;
    const content = generateNamespaceFile(api, 'chrome');
    fs.writeFileSync(path.join(chromeDir, `${ns}.d.ts`), content);
  });

  // Generate index file
  let indexContent = `/**\n * @zovo/types-chrome-extension\n * Comprehensive TypeScript definitions for Chrome Extensions\n * Version: ${PACKAGE_JSON.version}\n */\n\n`;
  
  normalized.chrome.forEach(api => {
    const ns = api.namespace;
    indexContent += `/// <reference path="./namespaces/${ns}.d.ts" />\n`;
  });
  
  fs.writeFileSync(
    path.join(PACKAGES_DIR, 'types-chrome-extension', 'src', 'index.d.ts'),
    indexContent
  );

  // Generate package.json
  const pkgJson = {
    name: '@zovo/types-chrome-extension',
    version: '1.0.0',
    description: 'TypeScript definitions for Chrome Extensions',
    types: 'src/index.d.ts',
    publishConfig: { access: 'public' }
  };
  fs.writeFileSync(
    path.join(PACKAGES_DIR, 'types-chrome-extension', 'package.json'),
    JSON.stringify(pkgJson, null, 2)
  );

  console.log(`     Generated ${normalized.chrome.length} Chrome namespace files`);
}

/**
 * Generate Firefox Extension types (using browser.* namespace)
 */
function generateFirefoxTypes(normalized) {
  console.log('  → Generating Firefox Extension types...');
  
  const firefoxDir = path.join(PACKAGES_DIR, 'types-firefox-extension', 'src', 'namespaces');
  
  // Generate individual namespace files
  normalized.firefox.forEach(api => {
    const ns = api.namespace.replace(/^browser\./, '');
    const content = generateNamespaceFile({ ...api, namespace: ns }, 'firefox');
    fs.writeFileSync(path.join(firefoxDir, `${ns}.d.ts`), content);
  });

  // Generate index file
  let indexContent = `/**\n * @zovo/types-firefox-extension\n * Comprehensive TypeScript definitions for Firefox WebExtensions\n * Version: ${PACKAGE_JSON.version}\n */\n\n`;
  
  normalized.firefox.forEach(api => {
    const ns = api.namespace.replace(/^browser\./, '');
    indexContent += `/// <reference path="./namespaces/${ns}.d.ts" />\n`;
  });
  
  fs.writeFileSync(
    path.join(PACKAGES_DIR, 'types-firefox-extension', 'src', 'index.d.ts'),
    indexContent
  );

  // Generate package.json
  const pkgJson = {
    name: '@zovo/types-firefox-extension',
    version: '1.0.0',
    description: 'TypeScript definitions for Firefox WebExtensions',
    types: 'src/index.d.ts',
    publishConfig: { access: 'public' }
  };
  fs.writeFileSync(
    path.join(PACKAGES_DIR, 'types-firefox-extension', 'package.json'),
    JSON.stringify(pkgJson, null, 2)
  );

  console.log(`     Generated ${normalized.firefox.length} Firefox namespace files`);
}

/**
 * Generate Safari Extension types
 */
function generateSafariTypes(normalized) {
  console.log('  → Generating Safari Extension types...');
  
  const safariDir = path.join(PACKAGES_DIR, 'types-safari-extension', 'src', 'namespaces');
  
  // Generate individual namespace files
  normalized.safari.forEach(api => {
    const ns = api.namespace.replace(/^chrome\./, '');
    const content = generateNamespaceFile({ ...api, namespace: ns }, 'safari');
    fs.writeFileSync(path.join(safariDir, `${ns}.d.ts`), content);
  });

  // Generate index file
  let indexContent = `/**\n * @zovo/types-safari-extension\n * Comprehensive TypeScript definitions for Safari App Extensions\n * Version: ${PACKAGE_JSON.version}\n */\n\n`;
  
  normalized.safari.forEach(api => {
    const ns = api.namespace.replace(/^chrome\./, '');
    indexContent += `/// <reference path="./namespaces/${ns}.d.ts" />\n`;
  });
  
  fs.writeFileSync(
    path.join(PACKAGES_DIR, 'types-safari-extension', 'src', 'index.d.ts'),
    indexContent
  );

  // Generate package.json
  const pkgJson = {
    name: '@zovo/types-safari-extension',
    version: '1.0.0',
    description: 'TypeScript definitions for Safari Extensions',
    types: 'src/index.d.ts',
    publishConfig: { access: 'public' }
  };
  fs.writeFileSync(
    path.join(PACKAGES_DIR, 'types-safari-extension', 'package.json'),
    JSON.stringify(pkgJson, null, 2)
  );

  console.log(`     Generated ${normalized.safari.length} Safari namespace files`);
}

/**
 * Generate Edge Extension types
 */
function generateEdgeTypes(normalized) {
  console.log('  → Generating Edge Extension types...');
  
  const edgeDir = path.join(PACKAGES_DIR, 'types-edge-extension', 'src', 'namespaces');
  
  // Generate individual namespace files
  normalized.edge.forEach(api => {
    const ns = api.namespace;
    const content = generateNamespaceFile(api, 'edge');
    fs.writeFileSync(path.join(edgeDir, `${ns.replace(/\./g, '_')}.d.ts`), content);
  });

  // Generate index file
  let indexContent = `/**\n * @zovo/types-edge-extension\n * Comprehensive TypeScript definitions for Microsoft Edge Extensions\n * Version: ${PACKAGE_JSON.version}\n */\n\n`;
  
  normalized.edge.forEach(api => {
    const ns = api.namespace.replace(/\./g, '_');
    indexContent += `/// <reference path="./namespaces/${ns}.d.ts" />\n`;
  });
  
  fs.writeFileSync(
    path.join(PACKAGES_DIR, 'types-edge-extension', 'src', 'index.d.ts'),
    indexContent
  );

  // Generate package.json
  const pkgJson = {
    name: '@zovo/types-edge-extension',
    version: '1.0.0',
    description: 'TypeScript definitions for Microsoft Edge Extensions',
    types: 'src/index.d.ts',
    publishConfig: { access: 'public' }
  };
  fs.writeFileSync(
    path.join(PACKAGES_DIR, 'types-edge-extension', 'package.json'),
    JSON.stringify(pkgJson, null, 2)
  );

  console.log(`     Generated ${normalized.edge.length} Edge namespace files`);
}

/**
 * Generate Common types (intersection of all browsers)
 */
function generateCommonTypes(normalized) {
  console.log('  → Generating WebExt Common types...');
  
  const commonDir = path.join(PACKAGES_DIR, 'types-webext-common', 'src', 'namespaces');
  
  // Generate individual namespace files
  normalized.common.forEach(api => {
    const ns = api.namespace.replace(/^(chrome|browser)\./, '');
    const content = generateNamespaceFile({ ...api, namespace: ns }, 'common');
    fs.writeFileSync(path.join(commonDir, `${ns}.d.ts`), content);
  });

  // Generate index file
  let indexContent = `/**\n * @zovo/types-webext-common\n * Cross-browser compatible TypeScript definitions for WebExtensions\n * Contains only APIs available in all supported browsers\n * Version: ${PACKAGE_JSON.version}\n */\n\n`;
  
  normalized.common.forEach(api => {
    const ns = api.namespace.replace(/^(chrome|browser)\./, '');
    indexContent += `/// <reference path="./namespaces/${ns}.d.ts" />\n`;
  });
  
  fs.writeFileSync(
    path.join(PACKAGES_DIR, 'types-webext-common', 'src', 'index.d.ts'),
    indexContent
  );

  // Generate package.json
  const pkgJson = {
    name: '@zovo/types-webext-common',
    version: '1.0.0',
    description: 'Cross-browser compatible WebExtension types',
    types: 'src/index.d.ts',
    publishConfig: { access: 'public' }
  };
  fs.writeFileSync(
    path.join(PACKAGES_DIR, 'types-webext-common', 'package.json'),
    JSON.stringify(pkgJson, null, 2)
  );

  console.log(`     Generated ${normalized.common.length} Common namespace files`);
}

/**
 * Generate Full types (union with browser discriminators)
 */
function generateFullTypes(normalized) {
  console.log('  → Generating WebExt Full types...');
  
  const fullDir = path.join(PACKAGES_DIR, 'types-webext-full', 'src', 'namespaces');
  
  // Generate individual namespace files with browser discriminators
  normalized.full.forEach(api => {
    const ns = api.namespace.replace(/^(chrome|browser)\./, '');
    
    let content = `/**\n * ${api.description || ns} API\n * Full type definitions with browser-specific variations\n */\n\n`;
    
    content += `declare namespace webext.${ns} {\n`;
    content += `  // Chrome-specific\n`;
    content += `  export interface Chrome extends Base {\n`;
    if (api.browserSpecific?.chrome) {
      api.browserSpecific.chrome.functions?.forEach(fn => {
        content += `    ${generateFunction(fn, '    ')};\n`;
      });
    }
    content += `  }\n\n`;
    
    content += `  // Firefox-specific\n`;
    content += `  export interface Firefox extends Base {\n`;
    if (api.browserSpecific?.firefox) {
      api.browserSpecific.firefox.functions?.forEach(fn => {
        content += `    ${generateFunction(fn, '    ')};\n`;
      });
    }
    content += `  }\n\n`;
    
    content += `  // Safari-specific\n`;
    content += `  export interface Safari extends Base {\n`;
    if (api.browserSpecific?.safari) {
      api.browserSpecific.safari.functions?.forEach(fn => {
        content += `    ${generateFunction(fn, '    ')};\n`;
      });
    }
    content += `  }\n\n`;
    
    content += `  // Edge-specific\n`;
    content += `  export interface Edge extends Base {\n`;
    if (api.browserSpecific?.edge) {
      api.browserSpecific.edge.functions?.forEach(fn => {
        content += `    ${generateFunction(fn, '    ')};\n`;
      });
    }
    content += `  }\n`;
    
    content += `}\n`;
    
    fs.writeFileSync(path.join(fullDir, `${ns}.d.ts`), content);
  });

  // Generate index file
  let indexContent = `/**\n * @zovo/types-webext-full\n * Complete WebExtension TypeScript definitions with browser discriminators\n * Version: ${PACKAGE_JSON.version}\n */\n\n`;
  
  indexContent += `export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge';\n\n`;
  
  normalized.full.forEach(api => {
    const ns = api.namespace.replace(/^(chrome|browser)\./, '');
    indexContent += `/// <reference path="./namespaces/${ns}.d.ts" />\n`;
  });
  
  fs.writeFileSync(
    path.join(PACKAGES_DIR, 'types-webext-full', 'src', 'index.d.ts'),
    indexContent
  );

  // Generate package.json
  const pkgJson = {
    name: '@zovo/types-webext-full',
    version: '1.0.0',
    description: 'Full WebExtension types with browser discriminators',
    types: 'src/index.d.ts',
    publishConfig: { access: 'public' }
  };
  fs.writeFileSync(
    path.join(PACKAGES_DIR, 'types-webext-full', 'package.json'),
    JSON.stringify(pkgJson, null, 2)
  );

  console.log(`     Generated ${normalized.full.length} Full namespace files`);
}

/**
 * Generate tsconfig.json for each package
 */
function generateTsconfigs() {
  packages.forEach(pkg => {
    const tsconfig = {
      compilerOptions: {
        target: "ES2020",
        module: "commonjs",
        lib: ["ES2020", "DOM"],
        declaration: true,
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        noImplicitThis: true,
        alwaysStrict: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        moduleResolution: "node",
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "**/*.spec.ts"]
    };
    
    fs.writeFileSync(
      path.join(PACKAGES_DIR, pkg, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2)
    );
  });
}

// Helper
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Main
async function main() {
  console.log('📝 Starting Type Generation Phase\n');
  console.log('═'.repeat(50));

  try {
    const normalized = require(path.join(NORMALIZED_DIR, 'all-apis.json'));
    
    generateChromeTypes(normalized);
    generateFirefoxTypes(normalized);
    generateSafariTypes(normalized);
    generateEdgeTypes(normalized);
    generateCommonTypes(normalized);
    generateFullTypes(normalized);
    generateTsconfigs();

    console.log('\n' + '═'.repeat(50));
    console.log('✅ Type Generation Complete');
    console.log('   Generated 6 packages:');
    console.log('   - @zovo/types-chrome-extension');
    console.log('   - @zovo/types-firefox-extension');
    console.log('   - @zovo/types-safari-extension');
    console.log('   - @zovo/types-edge-extension');
    console.log('   - @zovo/types-webext-common');
    console.log('   - @zovo/types-webext-full');
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('\n❌ Error during type generation:', error);
    process.exit(1);
  }
}

module.exports = { generateChromeTypes, generateFirefoxTypes, generateSafariTypes, generateEdgeTypes };

if (require.main === module) {
  main();
}
