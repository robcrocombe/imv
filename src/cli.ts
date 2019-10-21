#!/usr/bin/env node

import program from 'commander';
import { imv } from './index';
import { log } from './log';

program
  .description('imv -- interactive move files')
  .version('1.0.0', '-v, --version', 'output the version number')
  .arguments('<glob>')
  .option('-e, --editor <editor>', 'use this editor to modify your file paths')
  .option('-o, --overwrite', 'overwrite existing files') // TODO
  .option('-t, --trash', 'send existing files to the trash bin') // TODO
  .option('-c, --cleanup', 'remove empty folders after moving files') // TODO
  .parse(process.argv);

if (!program.args.length) {
  program.outputHelp();
  exit(false);
}

const { editor, overwrite, trash, cleanup } = program;

imv(program.args, { editor, overwrite, trash, cleanup })
  .then(result => {
    exit(result);
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
