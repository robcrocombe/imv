#!/usr/bin/env node

import program from 'commander';
import { run } from './index';
import { log } from './log';

program
  .description('imv -- interactive move files')
  .version('1.0.0', '-v, --version', 'output the version number')
  .arguments('<glob>')
  .option('-e, --editor <editor>', 'use this editor to modify your file paths')
  .option('-o, --overwrite', 'overwrite existing files') // TODO
  .option('-c, --cleanup', 'remove empty folders after moving files') // TODO
  .parse(process.argv);

if (!program.args.length) {
  program.outputHelp();
  exit(false);
}

const { editor, overwrite, cleanup } = program;

run(program.args, { editor, overwrite, cleanup })
  .then(result => {
    exit(result);
  })
  .catch(err => {
    if (err && err.message) {
      log.error(err.message);
    } else {
      log(err);
    }
  });

function exit(success: boolean) {
  process.exit(success ? 0 : 1);
}
