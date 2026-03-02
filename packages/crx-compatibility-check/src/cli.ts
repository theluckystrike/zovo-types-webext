import { Command } from 'commander';
import { checkCompatibility, formatReport } from './core';

const program = new Command();

program
  .name('crx-compatibility-check')
  .description('Check Chrome extension cross-browser compatibility')
  .version('1.0.0')
  .argument('<path>', 'Path to extension directory')
  .action((extPath: string) => {
    const report = checkCompatibility(extPath);
    console.log(formatReport(report));
  });

program.parse();
