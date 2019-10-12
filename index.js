#!/usr/bin/env node

const program = require('commander');
const glob = require('globby');
const tmp = require('tmp');
// const rl = require('readline-sync');
// const moment = require('moment');
const fs = require('fs-extra');
const path = require('path');
const EOL = require('os').EOL;
const { execSync } = require('child_process');
const { getGitEditor } = require('./git-editor');

program
  .version('1.0.0')
  .arguments('<glob>')
  .option('-b, --base <dir>', 'display file paths relative to this directory')
  .option('-e, --editor <editor>', 'use this editor to modify your file paths')
  .parse(process.argv);

const input = program.args;

if (!input.length) {
  program.outputHelp();
  exit(false);
}

run();

async function run() {
  const files = input.length > 1 ? input : await glob(input);
  // console.log(files);

  tmp.setGracefulCleanup();
  const dir = tmp.dirSync({ unsafeCleanup: true });

  console.log(dir.name);

  const editor = program.editor || (await getGitEditor());

  if (!editor) {
    console.error(
      'Your git `config.editor` variable is not set or you are missing `--editor` argument.'
    );
    exit(false);
  }

  try {
    const tmpFile = path.join(dir.name, 'FILES');
    fs.writeFileSync(tmpFile, files.join(EOL) + EOL, 'utf8');

    const out = execSync(`${editor} ${tmpFile}`);
  } catch (e) {
    console.error(e);
  }
}

function exit(success) {
  process.exit(success ? 0 : 1);
}
