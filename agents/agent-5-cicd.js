/**
 * AGENT 5: CI/CD & Publishing Automation
 * GitHub Actions, npm publishing, and release automation
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = '/Users/mike/zovo-types';
const GITHUB_WORKFLOWS_DIR = path.join(PROJECT_ROOT, '.github', 'workflows');

console.log('🤖 AGENT 5: CI/CD & Publishing Automation\n');
console.log('='.repeat(60));

// Create GitHub Actions workflows directory
if (!fs.existsSync(GITHUB_WORKFLOWS_DIR)) {
  fs.mkdirSync(GITHUB_WORKFLOWS_DIR, { recursive: true });
}

// 1. Main CI workflow
const ciWorkflow = `# name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Type check
      run: npm run typecheck
    
    - name: Run tests
      run: npm test
    
    - name: Build packages
      run: npm run build
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
        flags: unittests

  quality:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run quality validation
      run: |
        npm install
        node agents/agent-1-validator.js
    
    - name: Check for critical errors
      run: |
        if [ \$(jq '.results.errors | length' quality-validation-report.json) -gt 0 ]; then
          echo "Critical errors found!"
          cat quality-validation-report.json
          exit 1
        fi

  publish:
    needs: [test, quality]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20
        registry-url: 'https://registry.npmjs.org'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Publish @zovo/types-chrome-extension
      run: npm publish --access public
      env:
        NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
      working-directory: packages/types-chrome-extension
    
    - name: Publish @zovo/types-firefox-extension
      run: npm publish --access public
      env:
        NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
      working-directory: packages/types-firefox-extension
    
    - name: Publish @zovo/types-safari-extension
      run: npm publish --access public
      env:
        NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
      working-directory: packages/types-safari-extension
    
    - name: Publish @zovo/types-edge-extension
      run: npm publish --access public
      env:
        NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
      working-directory: packages/types-edge-extension
    
    - name: Publish @zovo/types-webext-common
      run: npm publish --access public
      env:
        NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
      working-directory: packages/types-webext-common
    
    - name: Publish @zovo/types-webext-full
      run: npm publish --access public
      env:
        NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
      working-directory: packages/types-webext-full
    
    - name: Publish @zovo/type-helpers
      run: npm publish --access public
      env:
        NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
      working-directory: packages/type-helpers

  release:
    needs: [publish]
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Generate release notes
      run: |
        echo "# @zovo/types-webext Release" > release-notes.md
        echo "" >> release-notes.md
        echo "## Changes" >> release-notes.md
        cat docs/CHANGELOG-API.md >> release-notes.md
    
    - name: Create GitHub Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: v\${{ github.run_number }}
        release_name: Release v\${{ github.run_number }}
        body_path: release-notes.md
        draft: false
        prerelease: false
`;

fs.writeFileSync(path.join(GITHUB_WORKFLOWS_DIR, 'ci.yml'), ciWorkflow);
console.log('✅ CI workflow');

// 2. Weekly update workflow
const weeklyWorkflow = `# name: Weekly API Update

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        token: \${{ secrets.GITHUB_TOKEN }}
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run weekly loop
      run: npm run loop
    
    - name: Check for changes
      id: changes
      run: |
        if [ -n "\$(git status --porcelain)" ]; then
          echo "::set-output name=has_changes::true"
        else
          echo "::set-output name=has_changes::false"
        fi
    
    - name: Create Pull Request
      if: steps.changes.outputs.has_changes == 'true'
      uses: actions/checkout@v4
      with:
        ref: develop
        fetch-depth: 0
    
    - name: Commit and push
      if: steps.changes.outputs.has_changes == 'true'
      run: |
        git config --local user.email "github-actions[bot]@users.noreply.github.com"
        git config --local user.name "github-actions[bot]"
        git add -A
        git commit -m "chore: Weekly API type definitions update"
        git push origin develop
`;

fs.writeFileSync(path.join(GITHUB_WORKFLOWS_DIR, 'weekly-update.yml'), weeklyWorkflow);
console.log('✅ Weekly update workflow');

// 3. Issue triage workflow
const triageWorkflow = `# name: Issue Triage

on:
  issues:
    types: [opened, labeled]
  pull_request:
    types: [opened, synchronize]

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Check for type issues
      run: |
        # Quick type check on PR changes
        npx tsc --noEmit --project packages/types-chrome-extension/tsconfig.json || true
    
    - name: Add triage label
      if: github.event_name == 'issues'
      uses: actions-ecosystem/action-add-labels@v1
      with:
        labels: 'needs-triage'
        github_token: \${{ secrets.GITHUB_TOKEN }}
`;

fs.writeFileSync(path.join(GITHUB_WORKFLOWS_DIR, 'triage.yml'), triageWorkflow);
console.log('✅ Issue triage workflow');

// 4. Create issue templates
const issuesDir = path.join(PROJECT_ROOT, '.github', 'ISSUE_TEMPLATE');
if (!fs.existsSync(issuesDir)) {
  fs.mkdirSync(issuesDir, { recursive: true });
}

const bugReportTemplate = `---
name: Bug report
about: Report something that's not working correctly
title: '[Bug] '
labels: bug
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Use package '...'
2. Call '...'
3. See error

**Expected behavior**
A clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. macOS, Windows]
 - Node version: [e.g. 14]
 - Package version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
`;

const featureRequestTemplate = `---
name: Feature request
about: Suggest a new feature or improvement
title: '[Feature] '
labels: enhancement
assignees: ''

---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context about the feature request here.
`;

fs.writeFileSync(path.join(issuesDir, 'bug-report.md'), bugReportTemplate);
fs.writeFileSync(path.join(issuesDir, 'feature-request.md'), featureRequestTemplate);
console.log('✅ Issue templates');

// 5. Create PR template
const prTemplate = `## Description

Please include a summary of the changes and the related issue.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update

## Testing

Please describe the tests that you ran to verify your changes.

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
`;

fs.writeFileSync(path.join(PROJECT_ROOT, '.github', 'pull_request_template.md'), prTemplate);
console.log('✅ PR template');

// 6. Create contributing guide
const contributingGuide = `# Contributing to @zovo/types-webext

## Development Setup

\`\`\`bash
git clone https://github.com/theluckystrike/zovo-types-webext.git
cd zovo-types-webext
npm install
\`\`\`

## Project Structure

\`\`\`
.
├── packages/              # Type definition packages
│   ├── types-chrome-extension/
│   ├── types-firefox-extension/
│   ├── types-safari-extension/
│   ├── types-edge-extension/
│   ├── types-webext-common/
│   ├── types-webext-full/
│   └── type-helpers/
├── agents/               # Automation scripts
├── tests/                # Test files
├── docs/                 # Documentation
└── .github/              # GitHub workflows & templates
\`\`\`

## Making Changes

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Make your changes
4. Run tests: \`npm test\`
5. Commit your changes (\`git commit -m 'Add amazing feature'\`)
6. Push to the branch (\`git push origin feature/amazing-feature\`)
7. Open a Pull Request

## Adding New API Types

1. Add the API definition to the appropriate source file in \`packages/\`
2. Run \`npm run generate\` to regenerate all packages
3. Add tests in \`tests/\`
4. Update documentation

## Running Agents

\`\`\`bash
# Run quality validation
node agents/agent-1-validator.js

# Generate documentation
node agents/agent-2-docs.js

# Run tests
node agents/agent-3-tests.js

# Add advanced types
node agents/agent-4-typescript.js

# Run full weekly loop
npm run loop
\`\`\`

## Publishing

Publishing is automated via GitHub Actions. On merge to \`main\`, all packages are published to npm.

## Code of Conduct

Please be respectful and professional in all interactions.
`;

fs.writeFileSync(path.join(PROJECT_ROOT, 'CONTRIBUTING.md'), contributingGuide);
console.log('✅ Contributing guide');

// 7. Update package.json with scripts
const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

packageJson.scripts = {
  ...packageJson.scripts,
  "lint": "echo 'No linter configured yet'",
  "typecheck": "tsc --noEmit --project packages/types-chrome-extension/tsconfig.json",
  "test": "node agents/agent-3-tests.js",
  "validate": "node agents/agent-1-validator.js",
  "docs": "node agents/agent-2-docs.js",
  "loop": "npm run validate && npm run docs && npm run test && echo 'Weekly loop complete'",
  "prepublishOnly": "npm run loop"
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json scripts');

// 8. Create .npmignore
const npmIgnore = `# Dependencies
node_modules/

# Build outputs
dist/
build/

# Test outputs
coverage/
.nyc_output/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Debug logs
*.log
npm-debug.log*

# Local env files
.env
.env.local
.env.*.local

# Git
.git/
.gitignore

# CI/CD
.github/
.gitattributes

# Docs (for npm package - types are in src/)
README.md
CONTRIBUTING.md
docs/
agents/
tests/
*.test.ts
*.spec.ts
`;

fs.writeFileSync(path.join(PROJECT_ROOT, '.npmignore'), npmIgnore);
console.log('✅ .npmignore');

console.log('\n📊 CI/CD & Publishing Additions:');
console.log('   - 3 GitHub Actions workflows');
console.log('   - 2 issue templates');
console.log('   - 1 PR template');
console.log('   - Contributing guide');
console.log('   - Updated npm scripts');
console.log('   - .npmignore file');

console.log('\n✅ AGENT 5 COMPLETE: CI/CD & Publishing automation complete');
