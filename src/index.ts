#!/usr/bin/env node

import program from 'commander';
import globby from 'globby';
import * as tmp from 'tmp';
import * as fs from 'fs-extra';
import * as path from 'path';
import { EOL } from 'os';
import { execSync } from 'child_process';
import { getGitEditor } from './git-editor';
import { validateFiles } from './validate-files';
import { log } from './log';

program
  .description('imv -- interactive move files')
  .version('1.0.0', '-v, --version', 'output the version number')
  .arguments('<glob>')
  .option('-e, --editor <editor>', 'use this editor to modify your file paths')
  .option('-o, --overwrite', 'overwrite existing files')
  .option('-c, --cleanup', 'remove empty folders after moving files')
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

  if (!oldFiles || !oldFiles.length) {
    log.warn(`No files found matching "${input.join(', ')}". Aborting.`);
    exit(true);
  }

  const dir = tmp.dirSync({ unsafeCleanup: true });

  const editor = program.editor || getGitEditor();
  const overwrite = !!program.overwrite;

  if (!editor) {
    log.error(
      'Your git `config.editor` variable is not set or you are missing `--editor` argument.'
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
      log.warn('Files unchanged. Aborting.');
      exit(true);
    }

    validateFiles(oldFiles, newFiles, overwrite);

    for (let i = 0; i < newFiles.length; ++i) {
      const oldFile = oldFiles[i];
      const newFile = newFiles[i];

      const p = fs.move(oldFile, newFile, { overwrite });

      renamePromises.push(p);
    }
  } catch (err) {
    log.warn(err);
    exit(false);
  }

  await Promise.all(renamePromises).catch(err => {
    if (err && err.message) {
      log.error(err.message);
    } else {
      log(err);
    }
    exit(false);
  });

  log('✨ Done!');
}

function exit(success) {
  process.exit(success ? 0 : 1);
}
