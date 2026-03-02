import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import gzipSize from 'gzip-size';
import brotliSize from 'brotli-size';

export interface SizeEntry {
  file: string;
  rawSize: number;
  gzipSize: number;
  brotliSize: number;
  percentOfTotal: number;
}

export interface SizeReport {
  totalRawSize: number;
  totalGzipSize: number;
  totalBrotliSize: number;
  files: SizeEntry[];
  largestDeps: SizeEntry[];
  optimizationTips: string[];
}

function calculateSize(filePath: string, baseSize: number): SizeEntry {
  const content = fs.readFileSync(filePath);
  const rawSize = content.length;
  const gzip = gzipSize.sync(content);
  const brotli = brotliSize.sync(content);
  return {
    file: path.relative(process.cwd(), file),
    rawSize,
    gzipSize: gzip,
    brotliSize: brotli,
    percentOfTotal: (rawSize / baseSize) * 100
  };
}

export async function analyzeExtension(extensionPath: string): Promise<SizeReport> {
  const files: string[] = [];
  
  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walkDir(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(extensionPath);
  
  const entries = files.map(f => {
    const content = fs.readFileSync(f);
    return {
      file: path.relative(extensionPath, f),
      rawSize: content.length,
      gzipSize: gzipSize.sync(content),
      brotliSize: brotliSize.sync(content),
      percentOfTotal: 0
    };
  });
  
  const totalRawSize = entries.reduce((sum, e) => sum + e.rawSize, 0);
  const totalGzipSize = entries.reduce((sum, e) => sum + e.gzipped, 0);
  const totalBrotliSize = entries.reduce((sum, e) => sum + e.brotli, 0);
  
  entries.forEach(e => e.percentOfTotal = (e.rawSize / totalRawSize) * 100);
  
  const largestDeps = entries
    .filter(e => e.file.includes('node_modules') || e.file.includes('dist/'))
    .sort((a, b) => b.rawSize - a.rawSize)
    .slice(0, 10);
  
  const optimizationTips: string[] = [];
  if (totalGzipSize > 200 * 1024) {
    optimizationTips.push('Consider using dynamic imports for large dependencies');
  }
  if (entries.some(e => e.file.endsWith('.map'))) {
    optimizationTips.push('Remove source maps from production build');
  }
  const largeImages = entries.filter(e => e.file.match(/\.(png|jpg|gif)$/) && e.rawSize > 50 * 1024);
  if (largeImages.length > 0) {
    optimizationTips.push('Compress or convert large images to WebP');
  }
  
  return {
    totalRawSize,
    totalGzipSize,
    totalBrotliSize,
    files: entries.sort((a, b) => b.rawSize - a.rawSize),
    largestDeps,
    optimizationTips
  };
}

export function formatReport(report: SizeReport): string {
  let output = `╔══════════════════════════════════════════════════════════════╗
║                    EXTENSION SIZE ANALYSIS                      ║
╠══════════════════════════════════════════════════════════════╣
║  Total Raw Size:      ${(report.totalRawSize / 1024).toFixed(2)} KB
║  Total Gzipped:       ${(report.totalGzipSize / 1024).toFixed(2)} KB  
║  Total Brotli:        ${(report.totalBrotliSize / 1024).toFixed(2)} KB
╠══════════════════════════════════════════════════════════════╣
║  TOP 10 LARGEST FILES                                           ║
║  ─────────────────────────────────────────────────────────────  ${report.files.slice(0, 10).map((f, i) => `
║  ${i + 1}. ${f.file.padEnd(40)} ${(f.rawSize / 1024).toFixed(1)}KB (${f.percentOfTotal.toFixed(1)}%)`).join('')}
╠══════════════════════════════════════════════════════════════╣
║  OPTIMIZATION TIPS                                              ║
║  ─────────────────────────────────────────────────────────────  ${report.optimizationTips.map(t => `
║  • ${t}`).join('')}
╚══════════════════════════════════════════════════════════════╝`;
  return output;
}
