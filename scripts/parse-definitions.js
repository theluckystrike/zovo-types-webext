/**
 * @zovo/types-monorepo - Definition Parser
 * Parses raw API definitions from browser sources into normalized intermediate format
 */

const fs = require('fs');
const path = require('path');

const API_CACHE_DIR = path.join(__dirname, '../api-cache');
const NORMALIZED_DIR = path.join(API_CACHE_DIR, 'normalized');

if (!fs.existsSync(NORMALIZED_DIR)) {
  fs.mkdirSync(NORMALIZED_DIR, { recursive: true });
}

/**
 * Normalized API Definition Schema
 * {
 *   namespace: string,
 *   description: string,
 *   browser: 'chrome' | 'firefox' | 'safari' | 'edge',
 *   permissions: string[],
 *   events: ApiEvent[],
 *   functions: ApiFunction[],
 *   types: ApiType[],
 *   compatibility: {
 *     chrome?: string,
 *     firefox?: string,
 *     safari?: string,
 *     edge?: string
 *   }
 * }
 */

/**
 * Parse Chrome APIs into normalized format
 */
function parseChromeAPIs(rawData) {
  const normalized = [];
  const namespaces = rawData.namespaces || {};

  for (const [name, def] of Object.entries(namespaces)) {
    normalized.push({
      namespace: name,
      description: def.description || `${name} API`,
      browser: 'chrome',
      permissions: def.permissions || [],
      events: normalizeEvents(def.events || []),
      functions: normalizeFunctions(def.functions || []),
      types: normalizeTypes(def.types || []),
      compatibility: {
        chrome: rawData.version || 'latest'
      },
      source: rawData.source,
      originalDefinition: def
    });
  }

  return normalized;
}

/**
 * Parse Firefox APIs into normalized format
 */
function parseFirefoxAPIs(rawData) {
  const normalized = [];
  const namespaces = rawData.namespaces || {};

  for (const [name, def] of Object.entries(namespaces)) {
    // Convert Firefox's browser namespace to browser.tabs, browser.runtime, etc.
    const nsName = name === 'browser' ? 'browser' : name;

    normalized.push({
      namespace: `browser.${nsName}`,
      description: def.description || `${name} API`,
      browser: 'firefox',
      permissions: def.permissions || [],
      events: normalizeEvents(def.events || []),
      functions: normalizeFunctions(def.functions || []),
      types: normalizeTypes(def.types || []),
      compatibility: {
        firefox: rawData.version || 'latest'
      },
      source: rawData.source,
      originalDefinition: def
    });
  }

  return normalized;
}

/**
 * Parse Safari APIs into normalized format
 */
function parseSafariAPIs(rawData) {
  const normalized = [];
  const namespaces = rawData.namespaces || {};

  for (const [name, def] of Object.entries(namespaces)) {
    normalized.push({
      namespace: `chrome.${name}`,
      description: def.description || `${name} API`,
      browser: 'safari',
      permissions: def.permissions || [],
      events: normalizeEvents(def.events || []),
      functions: normalizeFunctions(def.functions || []),
      types: normalizeTypes(def.types || []),
      compatibility: {
        safari: rawData.version || 'latest'
      },
      source: rawData.source,
      originalDefinition: def
    });
  }

  return normalized;
}

/**
 * Parse Edge APIs into normalized format
 */
function parseEdgeAPIs(rawData) {
  const normalized = [];
  const namespaces = rawData.namespaces || {};

  for (const [name, def] of Object.entries(namespaces)) {
    const isEdgeOnly = def.browser === 'edge-only';
    
    normalized.push({
      namespace: isEdgeOnly ? `chrome.${name}` : name,
      description: def.description || `${name} API`,
      browser: 'edge',
      permissions: def.permissions || [],
      events: normalizeEvents(def.events || []),
      functions: normalizeFunctions(def.functions || []),
      types: normalizeTypes(def.types || []),
      compatibility: {
        chrome: rawData.version || 'latest',
        edge: rawData.version || 'latest'
      },
      source: rawData.source,
      isEdgeOnly,
      originalDefinition: def
    });
  }

  return normalized;
}

// Normalization helpers
function normalizeEvents(events) {
  return events.map(e => ({
    name: e.name || e,
    description: e.description || '',
    parameters: e.parameters || [],
    returns: e.returns || null
  }));
}

function normalizeFunctions(functions) {
  return functions.map(f => ({
    name: f.name || f,
    description: f.description || '',
    parameters: normalizeParameters(f.parameters || []),
    returns: f.returns || null,
    async: f.async || false,
    callback: f.callback || null
  }));
}

function normalizeParameters(params) {
  return params.map(p => ({
    name: p.name || p,
    type: p.type || 'any',
    description: p.description || '',
    optional: p.optional || false,
    default: p.default || null
  }));
}

function normalizeTypes(types) {
  return types.map(t => ({
    name: t.name || t,
    type: t.type || t,
    description: t.description || '',
    properties: t.properties || [],
    enum: t.enum || null,
    union: t.union || null,
    dictionary: t.dictionary || false
  }));
}

/**
 * Compute intersection of all browser APIs (common APIs)
 */
function computeCommonAPIs(allAPIs) {
  const apiMap = new Map();

  // Group by namespace
  for (const api of allAPIs) {
    const normalizedNs = api.namespace.replace(/^browser\./, 'chrome.');
    if (!apiMap.has(normalizedNs)) {
      apiMap.set(normalizedNs, {
        namespace: normalizedNs,
        browsers: new Set(),
        data: { ...api }
      });
    }
    apiMap.get(normalizedNs).browsers.add(api.browser);
  }

  // Find namespaces present in all 4 browsers
  const common = [];
  for (const [ns, info] of apiMap) {
    if (info.browsers.size >= 3) { // Chrome, Firefox, Safari minimum
      common.push({
        ...info.data,
        namespace: ns,
        supportedBrowsers: Array.from(info.browsers)
      });
    }
  }

  return common;
}

/**
 * Compute union of all APIs with discriminators
 */
function computeFullAPIs(allAPIs) {
  const apiMap = new Map();

  for (const api of allAPIs) {
    const normalizedNs = api.namespace;
    if (!apiMap.has(normalizedNs)) {
      apiMap.set(normalizedNs, {
        ...api,
        browserSpecific: {}
      });
    }
    // Merge browser-specific data
    apiMap.get(normalizedNs).browserSpecific[api.browser] = {
      permissions: api.permissions,
      events: api.events,
      functions: api.functions,
      types: api.types
    };
  }

  return Array.from(apiMap.values());
}

/**
 * Main parser function
 */
async function main() {
  console.log('🔄 Starting Parse Phase\n');
  console.log('═'.repeat(50));

  const rawDir = path.join(API_CACHE_DIR, 'raw');
  const allAPIs = [];

  try {
    // Load raw definitions
    const chromeRaw = require(path.join(rawDir, 'chrome-apis.json'));
    const firefoxRaw = require(path.join(rawDir, 'firefox-apis.json'));
    const safariRaw = require(path.join(rawDir, 'safari-apis.json'));
    const edgeRaw = require(path.join(rawDir, 'edge-apis.json'));

    // Parse each browser
    console.log('  → Parsing Chrome APIs...');
    const chromeParsed = parseChromeAPIs(chromeRaw);
    allAPIs.push(...chromeParsed);

    console.log('  → Parsing Firefox APIs...');
    const firefoxParsed = parseFirefoxAPIs(firefoxRaw);
    allAPIs.push(...firefoxParsed);

    console.log('  → Parsing Safari APIs...');
    const safariParsed = parseSafariAPIs(safariRaw);
    allAPIs.push(...safariParsed);

    console.log('  → Parsing Edge APIs...');
    const edgeParsed = parseEdgeAPIs(edgeRaw);
    allAPIs.push(...edgeParsed);

    // Compute common and full APIs
    console.log('  → Computing common APIs (intersection)...');
    const commonAPIs = computeCommonAPIs(allAPIs);

    console.log('  → Computing full APIs (union)...');
    const fullAPIs = computeFullAPIs(allAPIs);

    // Save normalized data
    const normalized = {
      chrome: chromeParsed,
      firefox: firefoxParsed,
      safari: safariParsed,
      edge: edgeParsed,
      common: commonAPIs,
      full: fullAPIs,
      metadata: {
        parsed: new Date().toISOString(),
        counts: {
          chrome: chromeParsed.length,
          firefox: firefoxParsed.length,
          safari: safariParsed.length,
          edge: edgeParsed.length,
          common: commonAPIs.length,
          full: fullAPIs.length
        }
      }
    };

    fs.writeFileSync(
      path.join(NORMALIZED_DIR, 'all-apis.json'),
      JSON.stringify(normalized, null, 2)
    );

    // Also save individual normalized files for each browser
    ['chrome', 'firefox', 'safari', 'edge'].forEach(browser => {
      fs.writeFileSync(
        path.join(NORMALIZED_DIR, `${browser}-normalized.json`),
        JSON.stringify(normalized[browser], null, 2)
      );
    });

    console.log('\n' + '═'.repeat(50));
    console.log('✅ Parse Complete');
    console.log(`   Chrome: ${normalized.metadata.counts.chrome} APIs`);
    console.log(`   Firefox: ${normalized.metadata.counts.firefox} APIs`);
    console.log(`   Safari: ${normalized.metadata.counts.safari} APIs`);
    console.log(`   Edge: ${normalized.metadata.counts.edge} APIs`);
    console.log(`   Common: ${normalized.metadata.counts.common} APIs`);
    console.log(`   Full: ${normalized.metadata.counts.full} APIs`);
    console.log('═'.repeat(50));

    return normalized;

  } catch (error) {
    console.error('\n❌ Error during parsing:', error);
    process.exit(1);
  }
}

module.exports = { 
  parseChromeAPIs, 
  parseFirefoxAPIs, 
  parseSafariAPIs, 
  parseEdgeAPIs,
  computeCommonAPIs,
  computeFullAPIs
};

if (require.main === module) {
  main();
}
