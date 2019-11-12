#!/usr/bin/env node

import program from 'commander';
import { imv } from './index';
import * as log from './log';

program
  .description('imv -- interactive move files')
  .version('1.0.0', '-v, --version', 'output the version number')
  .arguments('<glob>')
  .option('-e, --editor <editor>', 'use this editor to modify your file paths')
  .option('-g, --gitignore', 'ignore patterns in .gitignore that apply to globbed files')
  .option('-o, --overwrite', 'overwrite existing files')
  .option('-t, --trash', 'send existing files to the trash bin')
  .option('-c, --cleanup', 'remove empty affected folders after moving files')
  .parse(process.argv);

if (!program.args.length) {
  program.outputHelp();
  exit(false);
}

const { editor, overwrite, trash, cleanup, gitignore } = program;

imv(program.args, { editor, overwrite, trash, cleanup, gitignore })
  .then(result => {
    exit(result && result.success);
  })
  .catch(err => {
    if (err) {
      if (err.success != null) {
        // Logging handled by main program
        return exit(err.success);
      }
      if (err.stack) {
        log.error(err.stack);
      } else {
        log.error(err);
      }
    } else {
      log.error('An unknown error occurred.');
    }

    exit(false);
  });

function exit(success: boolean) {
  process.exit(success ? 0 : 1);
}
