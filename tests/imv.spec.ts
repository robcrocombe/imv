/// <reference path="../src/types.d.ts" />

import 'jest';
import * as fs from 'fs-extra';
import * as cp from 'child_process';
import * as path from 'path';
import rimraf from 'rimraf';
import chalk from 'chalk';
import { EOL } from 'os';
import { imv } from '../src/index';
import { log } from '../src/log';
import * as helpers from '../src/helpers';
import * as mockCp from './__mocks__/child_process';

chalk.enabled = false;

jest.mock('child_process');
jest.mock('delete-empty');
jest.mock('../src/log');

const mockedCp = (cp as unknown) as typeof mockCp;
const editor = 'subl';
const tempDir = './tests/temp';

helpers.__SET_TEST_PARENT_PATH(path.resolve(tempDir));

beforeAll(() => {
  mockedCp.__setEditor(editor);
});

beforeEach(() => {
  mockedCp.__setEdits(undefined);
  fs.copySync('./tests/fixtures', tempDir);
  jest.clearAllMocks();
});

afterEach(cb => {
  rimraf(tempDir, cb);
});

describe('Basic functionality', () => {
  it('moves a single file', async () => {
    setEdits('/foo/fidget2.txt');

    await run(files('/foo/fidget.txt'), { editor }, true);

    expect(fileExists('/foo/fidget.txt')).toBeFalsy();
    expect(fileContents('/foo/fidget2.txt')).toBe('weapon\n');

    expect(log).toHaveBeenCalledTimes(1);
  });

  it('moves using a glob pattern', async () => {
    setEdits('/flag2.doc', '/bar2/opera.doc', '/foo/myth.jpg');

    await run(files('/**/*.doc'), { editor }, true);

    expect(fileExists('/flag.doc')).toBeFalsy();
    expect(fileContents('/flag2.doc')).toBe('island\n');

    expect(fileExists('/bar/opera.doc')).toBeFalsy();
    expect(fileContents('/bar2/opera.doc')).toBe('pump\n');

    expect(fileExists('/foo/myth.doc')).toBeFalsy();
    expect(fileContents('/foo/myth.jpg')).toBe('tram\n');

    expect(log).toHaveBeenCalledTimes(1);
  });
});

describe('Overwrite behaviour', () => {
  it('cannot overwrite matching files with overwrite=false', async () => {
    setEdits('/foo/brand_new.js', '/foo/skate.js', '/foo/guitar.js');

    await run(
      files('/foo/guitar.js', '/foo/skate.js', '/foo/dollar.js'),
      { editor, overwrite: false },
      false
    );

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith('Error: file tests/temp/foo/guitar.js already exists.');
  });

  it('cannot overwrite matching files with overwrite=true', async () => {
    setEdits('/foo/brand_new.js', '/foo/skate.js', '/foo/guitar.js');

    await run(
      files('/foo/guitar.js', '/foo/skate.js', '/foo/dollar.js'),
      { editor, overwrite: true },
      false
    );

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Error: cannot rename tests/temp/foo/dollar.js to tests/temp/foo/guitar.js because the new file is also pending movement.'
    );
  });

  it('cannot overwrite non-matching files with overwrite=false', async () => {
    setEdits('/foo/guitar.js');

    await run(files('/foo/fidget.txt'), { editor, overwrite: false }, false);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith('Error: file tests/temp/foo/guitar.js already exists.');
  });

  it('overwrites non-matching files with overwrite=true', async () => {
    setEdits('/foo/guitar.js');

    await run(files('/foo/fidget.txt'), { editor, overwrite: true }, true);

    expect(log).toHaveBeenCalledTimes(1);
  });

  // , async () => {}
  it.todo('sends non-matching files to the recycle bin with trash=true');

  it('cannot run with both overwrite=true and trash=true', async () => {
    await run(files('/foo/fidget.txt'), { editor, overwrite: true, trash: true }, false);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Please use either `overwrite` or `trash` options, but not both at the same time.'
    );
  });
});

describe('Cleanup behaviour', () => {
  it.todo('deletes empty directories with cleanup=true');

  it.todo('keeps empty directories with cleanup=false');
});

describe('Erroneous input', () => {
  it('cannot run without input', async () => {
    await run([''], { editor }, true);

    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith('No files found matching "". Aborting.');
  });

  it('cannot run without a matching glob pattern', async () => {
    await run(files('/**/*.psd'), { editor }, true);

    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith(
      'No files found matching "tests/temp/**/*.psd". Aborting.'
    );
  });

  it('cannot run with existing files outside the cwd', async () => {
    setEdits('/foo/new1.js', '/foo/new2.js');

    await run(['tests/fixtures/flag.doc', 'tests/imv/foo/fidget.txt'], { editor }, false);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Error: existing file tests/fixtures/flag.doc must be a child of the working directory. Please start imv in the directory you want to use it.'
    );
  });

  it('cannot run with changed files outside the cwd', async () => {
    mockedCp.__setEdits('tests/fixtures/flag.doc' + EOL);

    await run([file('/flag.doc')], { editor }, false);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Error: new file tests/fixtures/flag.doc must be a child of the working directory. Please start imv in the directory you want to use it.'
    );
  });
});

function file(p: string): string {
  return path.join(tempDir, p);
}

function files(...args: string[]): string[] {
  return args.map(file);
}

function setEdits(...arr: string[]) {
  mockedCp.__setEdits(files(...arr).join(EOL) + EOL);
}

function fileExists(p: string): boolean {
  return fs.existsSync(file(p));
}

function fileContents(p: string): string {
  return fs.readFileSync(file(p), 'utf8');
}

function run(files: string[], opts: Options, success: boolean): Promise<any> {
  return expect(imv(files, opts))[success ? 'resolves' : 'rejects'].toStrictEqual({ success });
}
