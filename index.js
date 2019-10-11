#!/usr/bin/env node

const program = require('commander');
const glob = require('globby');
// const rl = require('readline-sync');
// const moment = require('moment');
// const fs = require('fs-extra');
// const dir = require('path');

program
  .version('1.0.0')
  .arguments('<glob>')
  .option('-b, --base <dir>', 'display file paths relative to this directory')
  .parse(process.argv);

const input = program.args;

if (!input.length) {
  program.outputHelp();
  exit(false);
  return;
}

run();

async function run() {
  const files = await glob(input);
  console.log(files);
}

function exit(success) {
  process.exit(success ? 0 : 1);
}
