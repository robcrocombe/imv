/// <reference path="../src/types.d.ts" />

import 'jest';
import * as fs from 'fs-extra';
import * as cp from 'child_process';
import chalk from 'chalk';
import { EOL } from 'os';
import { imv } from '../src/index';
import { log } from '../src/log';
import * as mockFs from './__mocks__/fs-extra';
import * as mockCp from './__mocks__/child_process';

chalk.enabled = false;

jest.mock('child_process');
jest.mock('../src/log');

const mockedFs = (fs as unknown) as typeof mockFs;
const mockedCp = (cp as unknown) as typeof mockCp;
const editor = 'subl';

beforeAll(() => {
  mockedCp.__setEditor(editor);
});

beforeEach(() => {
  mockedFs.__mockFs({
    './flag.png': 'island',
    './bar/opera.png': 'pump',
    './foo/fidget.txt': 'weapon',
    './foo/myth.png': 'tram',
    './foo/guitar.js': 'lemon',
    './foo/skate.js': 'king',
    './foo/dollar.js': 'oven',
  });
  jest.clearAllMocks();
});

it('moves a single file', async () => {
  setEdits(['./foo/fidget2.txt']);

  await run(['./foo/fidget.txt'], { editor }, true);

  expect(mockedFs.__getFile('./foo/fidget.txt')).toBeNull();
  expect(mockedFs.__getFile('./foo/fidget2.txt')).toBe('weapon');

  expect(log).toHaveBeenCalledTimes(1);
});

it('moves using a glob pattern', async () => {
  setEdits(['./flag2.png', './bar2/opera.png', './foo/myth.jpg']);

  await run(['./**/*.png'], { editor }, true);

  expect(mockedFs.__getFile('./flag.png')).toBeNull();
  expect(mockedFs.__getFile('./flag2.png')).toBe('island');

  expect(mockedFs.__getFile('./bar/opera.png')).toBeNull();
  expect(mockedFs.__getFile('./bar2/opera.png')).toBe('pump');

  expect(mockedFs.__getFile('./foo/myth.png')).toBeNull();
  expect(mockedFs.__getFile('./foo/myth.jpg')).toBe('tram');

  expect(log).toHaveBeenCalledTimes(1);
});

it('cannot overwrite matching files with overwrite=false', async () => {
  setEdits(['./foo/brand_new.js', './foo/skate.js', './foo/guitar.js']);

  await run(
    ['./foo/guitar.js', './foo/skate.js', './foo/dollar.js'],
    { editor, overwrite: false },
    false
  );

  expect(log.error).toHaveBeenCalledTimes(1);
  expect(log.error).toHaveBeenCalledWith('Error: file ./foo/guitar.js already exists.');
});

it('cannot overwrite matching files with overwrite=true', async () => {
  setEdits(['./foo/brand_new.js', './foo/skate.js', './foo/guitar.js']);

  await run(
    ['./foo/guitar.js', './foo/skate.js', './foo/dollar.js'],
    { editor, overwrite: true },
    false
  );

  expect(log.error).toHaveBeenCalledTimes(1);
  expect(log.error).toHaveBeenCalledWith(
    'Error: cannot rename ./foo/dollar.js to ./foo/guitar.js because the new file is also pending movement.'
  );
});

it('cannot overwrite non-matching files with overwrite=false', async () => {
  setEdits(['./foo/guitar.js']);

  await run(['./foo/fidget.txt'], { editor, overwrite: false }, false);

  expect(log.error).toHaveBeenCalledTimes(1);
  expect(log.error).toHaveBeenCalledWith('Error: file ./foo/guitar.js already exists.');
});

it('overwrites non-matching files with overwrite=true', async () => {
  setEdits(['./foo/guitar.js']);

  await run(['./foo/fidget.txt'], { editor, overwrite: true }, true);

  expect(log).toHaveBeenCalledTimes(1);
});

// , async () => {}
it.todo('sends non-matching files to the recycle bin with trash=true');

it('cannot execute with both overwrite=true and trash=true', async () => {
  await run(['./foo/fidget.txt'], { editor, overwrite: true, trash: true }, false);

  expect(log.error).toHaveBeenCalledTimes(1);
  expect(log.error).toHaveBeenCalledWith(
    'Please use either `overwrite` or `trash` options, but not both at the same time.'
  );
});

it('cannot execute without input', async () => {
  await run([''], { editor }, true);

  expect(log.warn).toHaveBeenCalledTimes(1);
  expect(log.warn).toHaveBeenCalledWith('No files found matching "". Aborting.');
});

it('cannot execute without a matching glob pattern', async () => {
  await run(['./**/*.psd'], { editor }, true);

  expect(log.warn).toHaveBeenCalledTimes(1);
  expect(log.warn).toHaveBeenCalledWith('No files found matching "./**/*.psd". Aborting.');
});

function setEdits(arr: string[]) {
  mockedCp.__setEdits(arr.join(EOL) + EOL);
}

function run(files: string[], opts: Options, success: boolean): Promise<any> {
  return expect(imv(files, opts))[success ? 'resolves' : 'rejects'].toStrictEqual({ success });
}
