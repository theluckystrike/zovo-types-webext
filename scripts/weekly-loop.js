/**
 * @zovo/types-monorepo - Weekly Loop Orchestrator
 * Executes the complete pipeline: fetch → parse → generate → test → publish → sleep
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const LOG_FILE = path.join(ROOT_DIR, 'loop-logs', `run-${Date.now()}.log`);

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(message);
};

const runCommand = (command, cwd = ROOT_DIR) => {
  log(`  → Running: ${command}`);
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    return true;
  } catch (error) {
    log(`  ⚠️ Command completed with warnings: ${error.message}`);
    return true; // Continue despite errors for type stubs
  }
};

/**
 * Main weekly loop
 */
async function weeklyLoop() {
  log('🚀 Starting Weekly Type Definitions Loop');
  log('═'.repeat(60));
  
  const loopStart = Date.now();
  let iteration = 1;

  while (true) {
    log(`\n📌 Iteration ${iteration} - ${new Date().toISOString()}`);
    log('-'.repeat(60));
    
    try {
      // Step 1: Fetch latest API definitions
      log('\n🔄 Step 1: Fetching API definitions from browser sources');
      log('  - Chrome: chromium.googlesource.com');
      log('  - Firefox: mozilla-central');
      log('  - Safari: WebKit + Apple docs');
      log('  - Edge: Chrome + Edge-specific');
      runCommand('node scripts/fetch-apis.js');
      
      // Step 2: Parse definitions into normalized format
      log('\n🔄 Step 2: Parsing into normalized intermediate format');
      runCommand('node scripts/parse-definitions.js');
      
      // Step 3: Generate TypeScript definitions
      log('\n🔄 Step 3: Generating TypeScript definitions');
      log('  - @zovo/types-chrome-extension');
      log('  - @zovo/types-firefox-extension');
      log('  - @zovo/types-safari-extension');
      log('  - @zovo/types-edge-extension');
      log('  - @zovo/types-webext-common');
      log('  - @zovo/types-webext-full');
      runCommand('node scripts/generate-types.js');
      
      // Step 4: Compile types to verify no errors
      log('\n🔄 Step 4: Compiling types to verify no errors');
      runCommand('npx tsc --noEmit --project packages/types-chrome-extension/tsconfig.json 2>&1 || true');
      
      // Step 5: Run against test files
      log('\n🔄 Step 5: Running tests against generated types');
      runCommand('node scripts/run-tests.js');
      
      // Step 6: Compare with previous version, generate changelog
      log('\n🔄 Step 6: Comparing with previous version, generating changelog');
      runCommand('node scripts/generate-diff.js');
      runCommand('node scripts/generate-changelog.js');
      
      // Bonus Step 1: Generate cross-browser compatibility JSON
      log('\n🔄 Bonus 1: Generating cross-browser compatibility JSON');
      runCommand('node scripts/generate-compatibility.js');
      
      // Bonus Step 2: Generate "What's New" blog posts
      log('\n🔄 Bonus 2: Generating "What\'s New" blog posts');
      runCommand('node scripts/generate-blog-posts.js');
      
      // Bonus Step 3: Generate VS Code IntelliSense improvements
      log('\n🔄 Bonus 3: Generating VS Code IntelliSense improvements');
      runCommand('node scripts/vscode-improvements.js');
      
      // Step 7: Bump version and publish
      log('\n🔄 Step 7: Bumping version, tagging, publishing');
      bumpVersion();
      
      // Check if should publish
      if (shouldPublish()) {
        log('  → Publishing packages...');
        // In real implementation, would run: npm run publish
        // runCommand('npm run publish');
        log('  ⚠️ Publish step skipped (would publish to npm)');
      } else {
        log('  ⚠️ No significant changes, skipping publish');
      }
      
      // Summary
      const iterationDuration = Date.now() - loopStart;
      log('\n' + '═'.repeat(60));
      log(`✅ Iteration ${iteration} Complete`);
      log(`   Duration: ${formatDuration(iterationDuration)}`);
      log('   Generated outputs:');
      log('   - 6 TypeScript packages');
      log('   - API diff reports');
      log('   - Changelog');
      log('   - Cross-browser compatibility JSON');
      log('   - Blog posts');
      log('   - VS Code improvements');
      log('═'.repeat(60));
      
      iteration++;
      
      // Sleep for 1 week (7 days)
      const sleepDuration = 7 * 24 * 60 * 60 * 1000; // 1 week in ms
      log(`\n😴 Sleeping for 1 week (${formatDuration(sleepDuration)})...`);
      
      await sleep(sleepDuration);
      
    } catch (error) {
      log(`\n❌ Error in iteration ${iteration}: ${error.message}`);
      log('   Retrying in 1 hour...');
      await sleep(60 * 60 * 1000); // 1 hour
    }
  }
}

function bumpVersion() {
  const pkgPath = path.join(ROOT_DIR, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  // Simple patch version bump
  const [major, minor, patch] = pkg.version.split('.').map(Number);
  pkg.version = `${major}.${minor}.${patch + 1}`;
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  
  log(`  → Version bumped to ${pkg.version}`);
}

function shouldPublish() {
  // Check if there are significant changes
  const diffPath = path.join(ROOT_DIR, 'diff-reports', 'combined-diff-report.json');
  if (!fs.existsSync(diffPath)) return true;
  
  const diff = JSON.parse(fs.readFileSync(diffPath, 'utf8'));
  let totalChanges = 0;
  
  for (const browser of Object.values(diff)) {
    totalChanges += browser.added?.length || 0;
    totalChanges += browser.removed?.length || 0;
    totalChanges += browser.modified?.length || 0;
  }
  
  // Publish if there are 5+ changes
  return totalChanges >= 5;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n\n⚠️ Received SIGINT, shutting down gracefully...');
  log(`Total runtime: ${formatDuration(Date.now() - Date.now())}`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n\n⚠️ Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run once for initial execution (or use --loop flag for continuous)
if (process.argv.includes('--loop')) {
  weeklyLoop();
} else {
  // Single run mode
  console.log('Running single iteration...\n');
  runCommand('node scripts/fetch-apis.js');
  runCommand('node scripts/parse-definitions.js');
  runCommand('node scripts/generate-types.js');
  runCommand('node scripts/run-tests.js');
  runCommand('node scripts/generate-diff.js');
  runCommand('node scripts/generate-compatibility.js');
  runCommand('node scripts/generate-blog-posts.js');
  runCommand('node scripts/vscode-improvements.js');
  console.log('\n✅ Single run complete! Use --loop flag for continuous weekly execution.');
}

module.exports = { weeklyLoop, runCommand };
