import { Command } from 'commander';
import { auditExtension, formatReport } from './core';

const program = new Command();

program
  .name('crx-security-audit')
  .description('Find security issues in Chrome extension code')
  .version('1.0.0')
  .argument('<path>', 'Path to extension directory')
  .option('-o, --output <file>', 'Output JSON report')
  .action((extPath: string, opts: any) => {
    const report = auditExtension(extPath);
    console.log(formatReport(report));
    if (opts.output) {
      fs.writeFileSync(opts.output, JSON.stringify(report, null, 2));
    }
    process.exit(report.cwsRejectionRisk ? 1 : 0);
  });

program.parse();
