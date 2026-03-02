# @zovo/crx-size-analyzer

Analyze Chrome extension bundle size breakdown with file-by-file analysis.

## Installation

```bash
npm install -g @zovo/crx-size-analyzer
# or
npx @zovo/crx-size-analyzer
```

## Usage

```bash
npx crx-size-analyzer ./my-extension
```

## Output

- File-by-file size breakdown
- Gzip and Brotli sizes
- Largest dependencies
- Optimization tips

## Example Output

```
╔══════════════════════════════════════════════════════════════╗
║                    EXTENSION SIZE ANALYSIS                      ║
╠══════════════════════════════════════════════════════════════╣
║  Total Raw Size:      1.2 MB
║  Total Gzipped:       350 KB
╚══════════════════════════════════════════════════════════════╝
```
