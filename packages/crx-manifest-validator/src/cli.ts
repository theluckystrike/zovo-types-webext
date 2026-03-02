import { Command } from 'commander';
import { validateManifest, formatResult } from './core';

const program = new Command();

program
  .name('crx-manifest-validator')
  .description('Validate manifest.json across Chrome, Firefox, Safari, Edge')
  .version('1.0.0')
  .argument('<manifest>', 'Path to manifest.json')
  .option('-b, --browsers <browsers>', 'Comma-separated browsers', 'chrome,firefox,safari,edge')
  .action((manifestPath: string, opts: any) => {
    const browsers = opts.browsers.split(',') as any[];
    const result = validateManifest(manifestPath, browsers);
    console.log(formatResult(result));
    process.exit(result.valid ? 0 : 1);
  });

program.parse();
