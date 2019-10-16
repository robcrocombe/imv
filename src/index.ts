#!/usr/bin/env node

import program from 'commander';
import globby from 'globby';
import * as tmp from 'tmp';
import * as fs from 'fs-extra';
import * as path from 'path';
import { EOL } from 'os';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { getGitEditor } from './git-editor';
import { validateFiles } from './validate-files';
// TODO: remove when Promise.allSettled() available
import allSettled from 'promise.allsettled';

program
  .description('imv -- interactive move files')
  .version('1.0.0')
  .arguments('<glob>')
  .option('-e, --editor <editor>', 'use this editor to modify your file paths')
  .parse(process.argv);

const input = program.args;

if (!input.length) {
  program.outputHelp();
  exit(false);
}

tmp.setGracefulCleanup();
run();

async function run() {
  // https://github.com/sindresorhus/globby/issues/109
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oldFiles: string[] = input.length > 1 ? input : await (globby as any)(input);
  // console.log(files);

  const dir = tmp.dirSync({ unsafeCleanup: true });

  console.log(dir.name);

  const editor = program.editor || getGitEditor();

  if (!editor) {
    console.error(
      chalk.red(
        'Your git `config.editor` variable is not set or you are missing `--editor` argument.'
      )
    );
    exit(false);
  }

  const renamePromises = [];

  try {
    const tmpFile = path.join(dir.name, 'FILES');
    fs.writeFileSync(tmpFile, oldFiles.join(EOL) + EOL, 'utf8');

    // Open files for renaming
    execSync(`${editor} ${tmpFile}`);

    const output = fs.readFileSync(tmpFile, 'utf8');
    const newFiles = output.trim().split(EOL);

    if (oldFiles.join() === newFiles.join()) {
      console.log(chalk.yellow('Files unchanged. Aborting.'));
      exit(true);
    }

    validateFiles(oldFiles, newFiles);

    for (let i = 0; i < newFiles.length; ++i) {
      const oldFile = oldFiles[i];
      const newFile = newFiles[i];

      const p = fs.rename(oldFile, newFile, err => {
        if (err) throw err;
      });

      renamePromises.push(p);
    }
  } catch (err) {
    console.error(chalk.red(err));
    exit(false);
  }

  await allSettled(renamePromises);
  console.log('✨ Done!');
}

function exit(success) {
  process.exit(success ? 0 : 1);
}
