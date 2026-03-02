# Contributing to @zovo/types-webext

## Development Setup

```bash
git clone https://github.com/theluckystrike/zovo-types-webext.git
cd zovo-types-webext
npm install
```

## Project Structure

```
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
```

## Making Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Adding New API Types

1. Add the API definition to the appropriate source file in `packages/`
2. Run `npm run generate` to regenerate all packages
3. Add tests in `tests/`
4. Update documentation

## Running Agents

```bash
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
```

## Publishing

Publishing is automated via GitHub Actions. On merge to `main`, all packages are published to npm.

## Code of Conduct

Please be respectful and professional in all interactions.
