#!/usr/bin/env node

const program = require('commander');
const glob = require('globby');
const tmp = require('tmp');
const fs = require('fs-extra');
const path = require('path');
const EOL = require('os').EOL;
const chalk = require('chalk');
const { execSync } = require('child_process');
const { getGitEditor } = require('./git-editor');
const { validateFiles } = require('./validate-files');
require('promise.allsettled').shim();

program
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
  const files = input.length > 1 ? input : await glob(input);
  // console.log(files);

  const dir = tmp.dirSync({ unsafeCleanup: true });

  console.log(dir.name);

  const editor = program.editor || (await getGitEditor());

  if (!editor) {
    console.error(chalk.red(
      'Your git `config.editor` variable is not set or you are missing `--editor` argument.'
    ));
    exit(false);
  }

  const renamePromises = [];

  try {
    const tmpFile = path.join(dir.name, 'FILES');
    fs.writeFileSync(tmpFile, files.join(EOL) + EOL, 'utf8');

    // Open files for renaming
    execSync(`${editor} ${tmpFile}`);

    const output = fs.readFileSync(tmpFile, 'utf8');
    const newFiles = output.trim().split(EOL);

    const fileMap = validateFiles(files, newFiles);

    for (let i = 0; i < newFiles.length; ++i) {
      const oldFile = files[i];
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

  await Promise.allSettled(renamePromises);
  console.log('✨ Done!');
}

function exit(success) {
  process.exit(success ? 0 : 1);
}
