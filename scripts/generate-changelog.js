/**
 * @zovo/types-monorepo - Changelog Generator
 * Compares with previous version and generates changelog
 */

const fs = require('fs');
const path = require('path');

const API_CACHE_DIR = path.join(__dirname, '../api-cache');
const DIFF_DIR = path.join(__dirname, '../diff-reports');
const ROOT_DIR = path.join(__dirname, '..');

/**
 * Compare versions and generate changelog
 */
function generateChangelog(currentVersion, previousVersion) {
  console.log(`  → Comparing v${previousVersion} → v${currentVersion}...`);
  
  const diffPath = path.join(DIFF_DIR, 'combined-diff-report.json');
  let diffs = {};
  
  if (fs.existsSync(diffPath)) {
    diffs = require(diffPath);
  }
  
  const changelog = {
    version: currentVersion,
    previousVersion,
    date: new Date().toISOString(),
    changes: {
      added: [],
      removed: [],
      modified: [],
      breaking: []
    },
    browserUpdates: {},
    typeChanges: {
      functions: { added: 0, removed: 0 },
      events: { added: 0, removed: 0 },
      types: { added: 0, removed: 0 }
    }
  };
  
  // Process diffs
  for (const [browser, diff] of Object.entries(diffs)) {
    changelog.browserUpdates[browser] = {
      added: diff.added.length,
      removed: diff.removed.length,
      modified: diff.modified.length
    };
    
    changelog.changes.added.push(...diff.added.map(a => ({
      ...a,
      browser
    })));
    
    changelog.changes.removed.push(...diff.removed.map(r => ({
      ...r,
      browser
    })));
    
    // Count type changes
    diff.modified.forEach(mod => {
      mod.changes.forEach(c => {
        if (c.type === 'function') {
          if (c.change === 'added') changelog.typeChanges.functions.added++;
          if (c.change === 'removed') changelog.typeChanges.functions.removed++;
        } else if (c.type === 'event') {
          if (c.change === 'added') changelog.typeChanges.events.added++;
          if (c.change === 'removed') changelog.typeChanges.events.removed++;
        } else if (c.type === 'type') {
          if (c.change === 'added') changelog.typeChanges.types.added++;
          if (c.change === 'removed') changelog.typeChanges.types.removed++;
        }
      });
    });
  }
  
  // Generate markdown changelog
  const markdown = generateMarkdownChangelog(changelog);
  
  // Save JSON changelog
  const changelogJsonPath = path.join(ROOT_DIR, 'CHANGELOG.json');
  fs.writeFileSync(changelogJsonPath, JSON.stringify(changelog, null, 2));
  
  // Append to markdown changelog
  const changelogMdPath = path.join(ROOT_DIR, 'CHANGELOG.md');
  const existingMd = fs.existsSync(changelogMdPath) ? fs.readFileSync(changelogMdPath, 'utf8') : '# Changelog\n\n';
  const newMd = markdown + '\n\n---\n\n' + existingMd;
  fs.writeFileSync(changelogMdPath, newMd);
  
  return changelog;
}

function generateMarkdownChangelog(changelog) {
  let md = `## [${changelog.version}] - ${formatDate(changelog.date)}\n\n`;
  
  // Summary
  const totalAdded = changelog.changes.added.length;
  const totalRemoved = changelog.changes.removed.length;
  const totalModified = changelog.changes.modified.reduce((sum, m) => sum + m.changes.length, 0);
  
  md += `### Summary\n`;
  md += `- **${totalAdded}** APIs added\n`;
  md += `- **${totalRemoved}** APIs removed\n`;
  md += `- **${totalModified}** API modifications\n\n`;
  
  // Browser breakdown
  md += `### Browser Updates\n`;
  for (const [browser, updates] of Object.entries(changelog.browserUpdates)) {
    md += `- **${capitalize(browser)}**: +${updates.added} ~${updates.modified} -${updates.removed}\n`;
  }
  md += '\n';
  
  // New APIs
  if (changelog.changes.added.length > 0) {
    md += `### ✨ New APIs\n\n`;
    const byBrowser = groupByBrowser(changelog.changes.added);
    for (const [browser, items] of Object.entries(byBrowser)) {
      md += `**${capitalize(browser)}**\n`;
      items.forEach(item => {
        md += `- \`${item.namespace}\` - ${item.description || 'New API'}\n`;
      });
      md += '\n';
    }
  }
  
  // Removed APIs
  if (changelog.changes.removed.length > 0) {
    md += `### 🔥 Removed APIs\n\n`;
    const byBrowser = groupByBrowser(changelog.changes.removed);
    for (const [browser, items] of Object.entries(byBrowser)) {
      md += `**${capitalize(browser)}**\n`;
      items.forEach(item => {
        md += `- \`${item.namespace}\`\n`;
      });
      md += '\n';
    }
  }
  
  // Type changes
  md += `### Type Changes\n`;
  md += `- Functions: +${changelog.typeChanges.functions.added} -${changelog.typeChanges.functions.removed}\n`;
  md += `- Events: +${changelog.typeChanges.events.added} -${changelog.typeChanges.events.removed}\n`;
  md += `- Types: +${changelog.typeChanges.types.added} -${changelog.typeChanges.types.removed}\n`;
  
  return md;
}

function groupByBrowser(items) {
  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.browser]) {
      grouped[item.browser] = [];
    }
    grouped[item.browser].push(item);
  });
  return grouped;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toISOString().split('T')[0];
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getPreviousVersion() {
  const pkgPath = path.join(ROOT_DIR, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = require(pkgPath);
    return pkg.version;
  }
  return '0.0.0';
}

function main() {
  console.log('📝 Generating Changelog\n');
  console.log('═'.repeat(50));

  const currentVersion = require(path.join(ROOT_DIR, 'package.json')).version;
  const previousVersion = getPreviousVersion();
  
  const changelog = generateChangelog(currentVersion, previousVersion);

  console.log('\n' + '═'.repeat(50));
  console.log('✅ Changelog Generated');
  console.log(`   Version: ${changelog.version}`);
  console.log(`   APIs Added: ${changelog.changes.added.length}`);
  console.log(`   APIs Removed: ${changelog.changes.removed.length}`);
  console.log(`   Modifications: ${changelog.changes.modified.reduce((s, m) => s + m.changes.length, 0)}`);
  console.log('═'.repeat(50));

  return changelog;
}

if (require.main === module) {
  main();
}

module.exports = { generateChangelog };
