import { Command } from 'commander';
import { analyzePermissions, formatReport } from './core';

const program = new Command();

program
  .name('crx-permission-analyzer')
  .description('Audit Chrome extension permissions with risk assessment')
  .version('1.0.0')
  .argument('<manifest>', 'Path to manifest.json')
  .action((manifestPath: string) => {
    try {
      const report = analyzePermissions(manifestPath);
      console.log(formatReport(report));
    } catch (error) {
      console.error('Error analyzing permissions:', error);
      process.exit(1);
    }
  });

program.parse();
