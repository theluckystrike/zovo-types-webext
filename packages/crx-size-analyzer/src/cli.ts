import { Command } from 'commander';
import { analyzeExtension, formatReport } from './core';

const program = new Command();

program
  .name('crx-size-analyzer')
  .description('Analyze Chrome extension bundle size breakdown')
  .version('1.0.0')
  .argument('<path>', 'Path to extension directory')
  .option('-o, --output <file>', 'Output JSON to file')
  .action(async (extPath: string) => {
    try {
      const report = await analyzeExtension(extPath);
      console.log(formatReport(report));
      if (program.opts().output) {
        const fs = require('fs');
        fs.writeFileSync(program.opts().output, JSON.stringify(report, null, 2));
      }
    } catch (error) {
      console.error('Error analyzing extension:', error);
      process.exit(1);
    }
  });

program.parse();
