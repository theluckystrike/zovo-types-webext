/**
 * @zovo/types-monorepo - Cross-Browser Compatibility JSON Generator
 * Generates machine-readable compatibility data
 */

const fs = require('fs');
const path = require('path');

const API_CACHE_DIR = path.join(__dirname, '../api-cache');
const ROOT_DIR = path.join(__dirname, '..');

/**
 * Generate cross-browser compatibility JSON
 */
function generateCompatibilityJSON() {
  console.log('🔗 Generating Cross-Browser Compatibility JSON\n');
  console.log('═'.repeat(50));

  const normalizedPath = path.join(API_CACHE_DIR, 'normalized', 'all-apis.json');
  
  if (!fs.existsSync(normalizedPath)) {
    console.log('  ⚠️ No normalized data found, run parser first');
    return;
  }
  
  const normalized = require(normalizedPath);
  
  const compatibility = {
    metadata: {
      generated: new Date().toISOString(),
      version: require(path.join(ROOT_DIR, 'package.json')).version,
      browsers: {
        chrome: normalized.metadata.counts.chrome,
        firefox: normalized.metadata.counts.firefox,
        safari: normalized.metadata.counts.safari,
        edge: normalized.metadata.counts.edge
      }
    },
    apiMatrix: {},
    commonAPIs: [],
    browserSpecificAPIs: {
      chrome: [],
      firefox: [],
      safari: [],
      edge: []
    },
    permissions: {}
  };

  // Build API matrix
  const apiMap = new Map();
  
  for (const browser of ['chrome', 'firefox', 'safari', 'edge']) {
    const apis = normalized[browser] || [];
    
    for (const api of apis) {
      const ns = api.namespace.replace(/^(browser|chrome)\./, '');
      
      if (!apiMap.has(ns)) {
        apiMap.set(ns, {
          name: ns,
          description: api.description,
          browsers: new Set(),
          permissions: new Set(),
          functions: new Set(),
          events: new Set()
        });
      }
      
      const entry = apiMap.get(ns);
      entry.browsers.add(browser);
      
      (api.permissions || []).forEach(p => entry.permissions.add(p));
      (api.functions || []).forEach(f => entry.functions.add(f.name));
      (api.events || []).forEach(e => entry.events.add(e.name));
    }
  }

  // Convert to compatibility format
  for (const [ns, data] of apiMap) {
    const browsers = Array.from(data.browsers);
    
    compatibility.apiMatrix[ns] = {
      description: data.description,
      support: {
        chrome: browsers.includes('chrome'),
        firefox: browsers.includes('firefox'),
        safari: browsers.includes('safari'),
        edge: browsers.includes('edge')
      },
      permissions: Array.from(data.permissions),
      functions: Array.from(data.functions),
      events: Array.from(data.events)
    };

    // Track common vs browser-specific
    if (browsers.length === 4) {
      compatibility.commonAPIs.push(ns);
    } else {
      browsers.forEach(b => {
        compatibility.browserSpecificAPIs[b].push(ns);
      });
    }

    // Track permissions
    for (const perm of data.permissions) {
      if (!compatibility.permissions[perm]) {
        compatibility.permissions[perm] = {
          description: `Requires "${perm}" permission`,
          apis: []
        };
      }
      compatibility.permissions[perm].apis.push(ns);
    }
  }

  // Add version info
  compatibility.metadata.browserVersions = {};
  const metadataPath = path.join(API_CACHE_DIR, 'fetch-metadata.json');
  if (fs.existsSync(metadataPath)) {
    const meta = require(metadataPath);
    for (const [browser, info] of Object.entries(meta.browsers)) {
      compatibility.metadata.browserVersions[browser] = info.version;
    }
  }

  // Add polyfill recommendations
  compatibility.polyfills = generatePolyfillRecommendations(compatibility);

  // Save
  const outputPath = path.join(ROOT_DIR, 'cross-browser-compatibility.json');
  fs.writeFileSync(outputPath, JSON.stringify(compatibility, null, 2));
  
  // Also save a minified version for runtime use
  const minifiedPath = path.join(ROOT_DIR, 'cross-browser-compatibility.min.json');
  fs.writeFileSync(minifiedPath, JSON.stringify(compatibility));

  console.log('\n' + '═'.repeat(50));
  console.log('✅ Compatibility JSON Generated');
  console.log(`   Common APIs: ${compatibility.commonAPIs.length}`);
  console.log(`   Chrome-only: ${compatibility.browserSpecificAPIs.chrome.length}`);
  console.log(`   Firefox-only: ${compatibility.browserSpecificAPIs.firefox.length}`);
  console.log(`   Safari-only: ${compatibility.browserSpecificAPIs.safari.length}`);
  console.log(`   Edge-only: ${compatibility.browserSpecificAPIs.edge.length}`);
  console.log(`   Saved to: ${outputPath}`);
  console.log('═'.repeat(50));

  return compatibility;
}

function generatePolyfillRecommendations(compatibility) {
  const polyfills = {};
  
  // Firefox-only APIs
  for (const api of compatibility.browserSpecificAPIs.firefox) {
    if (!polyfills[api]) {
      polyfills[api] = [];
    }
    polyfills[api].push({
      browser: 'firefox',
      message: 'API only available in Firefox. Use feature detection.',
      alternative: 'Check if method exists before calling'
    });
  }
  
  // Safari-only APIs
  for (const api of compatibility.browserSpecificAPIs.safari) {
    if (!polyfills[api]) {
      polyfills[api] = [];
    }
    polyfills[api].push({
      browser: 'safari',
      message: 'API only available in Safari.',
      alternative: 'Consider using Chrome API with Safari polyfill'
    });
  }
  
  return polyfills;
}

if (require.main === module) {
  generateCompatibilityJSON();
}

module.exports = { generateCompatibilityJSON };
