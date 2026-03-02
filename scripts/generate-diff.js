/**
 * @zovo/types-monorepo - Diff Generator
 * Generates browser API diff reports between versions
 */

const fs = require('fs');
const path = require('path');

const API_CACHE_DIR = path.join(__dirname, '../api-cache');
const DIFF_DIR = path.join(__dirname, '../diff-reports');

if (!fs.existsSync(DIFF_DIR)) {
  fs.mkdirSync(DIFF_DIR, { recursive: true });
}

/**
 * Compare two API versions and generate diff
 */
function generateDiff(oldVersion, newVersion, browser) {
  const oldPath = path.join(API_CACHE_DIR, `${browser}-apis-${oldVersion}.json`);
  const newPath = path.join(API_CACHE_DIR, `${browser}-apis-${newVersion}.json`);
  
  // If old version doesn't exist, create initial diff
  if (!fs.existsSync(oldPath)) {
    console.log(`  → No previous version found for ${browser}, creating initial diff`);
    return createInitialDiff(newVersion, browser);
  }
  
  const oldApis = require(oldPath);
  const newApis = require(newPath);
  
  const diff = {
    browser,
    fromVersion: oldVersion,
    toVersion: newVersion,
    generated: new Date().toISOString(),
    added: [],
    removed: [],
    modified: []
  };
  
  const oldNamespaces = new Set(Object.keys(oldApis.namespaces || {}));
  const newNamespaces = new Set(Object.keys(newApis.namespaces || {}));
  
  // Find added namespaces
  for (const ns of newNamespaces) {
    if (!oldNamespaces.has(ns)) {
      diff.added.push({
        namespace: ns,
        type: 'namespace',
        description: newApis.namespaces[ns].description
      });
    }
  }
  
  // Find removed namespaces
  for (const ns of oldNamespaces) {
    if (!newNamespaces.has(ns)) {
      diff.removed.push({
        namespace: ns,
        type: 'namespace'
      });
    }
  }
  
  // Find modified namespaces
  for (const ns of newNamespaces) {
    if (oldNamespaces.has(ns)) {
      const oldNs = oldApis.namespaces[ns];
      const newNs = newApis.namespaces[ns];
      
      const changes = compareNamespace(oldNs, newNs);
      if (changes.length > 0) {
        diff.modified.push({
          namespace: ns,
          changes
        });
      }
    }
  }
  
  return diff;
}

function createInitialDiff(version, browser) {
  const currentPath = path.join(API_CACHE_DIR, 'raw', `${browser}-apis.json`);
  
  if (!fs.existsSync(currentPath)) {
    return null;
  }
  
  const apis = require(currentPath);
  
  return {
    browser,
    fromVersion: '0.0.0',
    toVersion: version,
    generated: new Date().toISOString(),
    added: Object.keys(apis.namespaces || {}).map(ns => ({
      namespace: ns,
      type: 'namespace',
      description: apis.namespaces[ns].description
    })),
    removed: [],
    modified: []
  };
}

function compareNamespace(oldNs, newNs) {
  const changes = [];
  
  // Compare functions
  const oldFuncs = new Set((oldNs.functions || []).map(f => f.name));
  const newFuncs = new Set((newNs.functions || []).map(f => f.name));
  
  for (const func of newFuncs) {
    if (!oldFuncs.has(func)) {
      changes.push({ type: 'function', name: func, change: 'added' });
    }
  }
  
  for (const func of oldFuncs) {
    if (!newFuncs.has(func)) {
      changes.push({ type: 'function', name: func, change: 'removed' });
    }
  }
  
  // Compare events
  const oldEvents = new Set((oldNs.events || []).map(e => e.name));
  const newEvents = new Set((newNs.events || []).map(e => e.name));
  
  for (const event of newEvents) {
    if (!oldEvents.has(event)) {
      changes.push({ type: 'event', name: event, change: 'added' });
    }
  }
  
  // Compare types
  const oldTypes = new Set((oldNs.types || []).map(t => t.name));
  const newTypes = new Set((newNs.types || []).map(t => t.name));
  
  for (const type of newTypes) {
    if (!oldTypes.has(type)) {
      changes.push({ type: 'type', name: type, change: 'added' });
    }
  }
  
  return changes;
}

/**
 * Main function to generate all diffs
 */
function main() {
  console.log('📊 Generating API Diff Reports\n');
  console.log('═'.repeat(50));

  const browsers = ['chrome', 'firefox', 'safari', 'edge'];
  const allDiffs = {};

  browsers.forEach(browser => {
    console.log(`  → Generating ${browser} diff...`);
    
    // Get current version
    const metadataPath = path.join(API_CACHE_DIR, 'fetch-metadata.json');
    let currentVersion = '1.0.0';
    
    if (fs.existsSync(metadataPath)) {
      const metadata = require(metadataPath);
      currentVersion = metadata.browsers[browser]?.version || '1.0.0';
    }
    
    // Generate diff (from 0.0.0 for first run)
    const diff = generateDiff('0.0.0', currentVersion, browser);
    
    if (diff) {
      allDiffs[browser] = diff;
      
      // Save individual diff
      const diffFile = path.join(DIFF_DIR, `${browser}-diff-${currentVersion}.json`);
      fs.writeFileSync(diffFile, JSON.stringify(diff, null, 2));
      console.log(`     ✅ Saved ${browser} diff to ${path.basename(diffFile)}`);
    }
  });

  // Save combined diff report
  const combinedPath = path.join(DIFF_DIR, 'combined-diff-report.json');
  fs.writeFileSync(combinedPath, JSON.stringify(allDiffs, null, 2));

  // Generate markdown summary
  generateMarkdownSummary(allDiffs);

  console.log('\n' + '═'.repeat(50));
  console.log('✅ Diff Generation Complete');
  console.log(`   Saved to: ${DIFF_DIR}`);
  console.log('═'.repeat(50));
}

function generateMarkdownSummary(diffs) {
  let md = `# Browser API Diff Report\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  
  for (const [browser, diff] of Object.entries(diffs)) {
    md += `## ${capitalize(browser)}\n\n`;
    md += `**${diff.fromVersion}** → **${diff.toVersion}**\n\n`;
    
    if (diff.added.length > 0) {
      md += `### Added (${diff.added.length})\n\n`;
      diff.added.forEach(item => {
        md += `- \`${item.namespace}\` - ${item.description || 'New namespace'}\n`;
      });
      md += '\n';
    }
    
    if (diff.removed.length > 0) {
      md += `### Removed (${diff.removed.length})\n\n`;
      diff.removed.forEach(item => {
        md += `- \`${item.namespace}\`\n`;
      });
      md += '\n';
    }
    
    if (diff.modified.length > 0) {
      md += `### Modified (${diff.modified.length})\n\n`;
      diff.modified.forEach(item => {
        md += `- \`${item.namespace}\` (${item.changes.length} changes)\n`;
      });
      md += '\n';
    }
  }
  
  const mdPath = path.join(DIFF_DIR, 'diff-report.md');
  fs.writeFileSync(mdPath, md);
  console.log(`  ✅ Generated markdown summary: ${path.basename(mdPath)}`);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

if (require.main === module) {
  main();
}

module.exports = { generateDiff };
