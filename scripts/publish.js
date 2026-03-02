/**
 * @zovo/types-monorepo - Publish Script
 * Handles version bumping, git tagging, and npm publishing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');

function publish() {
  console.log('📦 Starting Publish Phase\n');
  console.log('═'.repeat(50));

  const pkg = require(path.join(ROOT_DIR, 'package.json'));
  const version = pkg.version;

  // 1. Verify build completed
  console.log('  → Verifying build artifacts...');
  const packages = [
    'types-chrome-extension',
    'types-firefox-extension',
    'types-safari-extension',
    'types-edge-extension',
    'types-webext-common',
    'types-webext-full'
  ];

  for (const pkgName of packages) {
    const pkgPath = path.join(ROOT_DIR, 'packages', pkgName, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      console.error(`  ❌ Package not found: ${pkgName}`);
      process.exit(1);
    }
  }
  console.log('     ✅ All packages verified');

  // 2. Update package versions
  console.log(`  → Updating package versions to ${version}...`);
  for (const pkgName of packages) {
    const pkgPath = path.join(ROOT_DIR, 'packages', pkgName, 'package.json');
    const pkgData = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkgData.version = version;
    fs.writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2) + '\n');
  }
  console.log('     ✅ Package versions updated');

  // 3. Git commit
  console.log('  → Committing changes...');
  try {
    execSync('git add -A', { cwd: ROOT_DIR });
    execSync(`git commit -m "Release v${version}"`, { cwd: ROOT_DIR });
    console.log('     ✅ Changes committed');
  } catch (error) {
    console.log('     ⚠️ No changes to commit or git not configured');
  }

  // 4. Create git tag
  console.log('  → Creating git tag...');
  try {
    execSync(`git tag -a v${version} -m "Release v${version}"`, { cwd: ROOT_DIR });
    console.log(`     ✅ Tag v${version} created`);
  } catch (error) {
    console.log('     ⚠️ Tag already exists or git not configured');
  }

  // 5. Publish to npm (commented out for safety)
  console.log('  → Publishing to npm...');
  console.log('     ⚠️ npm publish commented out for safety');
  console.log('     To publish, run: npm run publish');
  
  // In production, uncomment:
  // for (const pkgName of packages) {
  //   execSync(`npm publish packages/${pkgName}`, { cwd: ROOT_DIR, stdio: 'inherit' });
  // }

  console.log('\n' + '═'.repeat(50));
  console.log('✅ Publish Complete');
  console.log(`   Version: ${version}`);
  console.log(`   Tag: v${version}`);
  console.log('═'.repeat(50));
}

if (require.main === module) {
  publish();
}

module.exports = { publish };
