/// <reference path="../src/types.d.ts" />

import 'jest';
import * as fs from 'fs-extra';
import * as cp from 'child_process';
import * as path from 'path';
import * as trash from 'trash';
import rimraf from 'rimraf';
import chalk from 'chalk';
import { EOL } from 'os';
import { imv } from '../src/index';
import { log } from '../src/log';
import * as helpers from '../src/helpers';
// eslint-disable-next-line jest/no-mocks-import
import * as mockCp from './__mocks__/child_process';

chalk.enabled = false;

jest.mock('child_process');
jest.mock('../src/log');
jest.spyOn(trash, 'default');

const mockedCp = (cp as unknown) as typeof mockCp;
const editor = 'subl';
const tempDir = './tests/temp';

// To avoid a dependency on files outside the tempDir,
// set it as the "root" path in our helper functions so
// we can test what happens when we try to move outside files.
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
    expect(fileContents('/foo/fidget2.txt')).toBe('weapon' + EOL);

    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenLastCalledWith('✨ Done!');
  });

  it('moves using a glob pattern', async () => {
    setEdits('/flag2.doc', '/bar2/opera.doc', '/foo/myth.jpg');

    await run(files('/**/*.doc'), { editor }, true);

    expect(fileExists('/flag.doc')).toBeFalsy();
    expect(fileContents('/flag2.doc')).toBe('island' + EOL);

    expect(fileExists('/bar/opera.doc')).toBeFalsy();
    expect(fileContents('/bar2/opera.doc')).toBe('pump' + EOL);

    expect(fileExists('/foo/myth.doc')).toBeFalsy();
    expect(fileContents('/foo/myth.jpg')).toBe('tram' + EOL);

    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenLastCalledWith('✨ Done!');
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

  // eslint-disable-next-line jest/no-commented-out-tests
  // it('cannot overwrite the same file with a different letter case', async () => {
  //   setEdits('/Flag.doc', '/foo/dollar.JS', '/Bar/opera.doc');

  //   await run(
  //     files('/flag.doc', '/foo/dollar.js', '/bar/opera.doc'),
  //     { editor, overwrite: false },
  //     false
  //   );

  //   expect(log.error).toHaveBeenCalledTimes(1);
  //   expect(log.error).toHaveBeenCalledWith(
  //     'Error: file tests/temp/Flag.js already exists.\n' +
  //     'Error: file tests/temp/foo/dollar.JS already exists.\n' +
  //     'Error: file tests/temp/Bar/opera.doc already exists.\n');
  // });

  it('cannot overwrite matching files with overwrite=true', async () => {
    setEdits('/foo/dollar.js', '/foo/skate.js', '/foo/brand_new.js');

    await run(
      files('/foo/guitar.js', '/foo/skate.js', '/foo/dollar.js'),
      { editor, overwrite: true },
      false
    );

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Error: cannot rename tests/temp/foo/guitar.js to tests/temp/foo/dollar.js because the new file is also pending movement.'
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

    expect(trash.default).toHaveBeenCalledTimes(0);
    expect(log).toHaveBeenCalledTimes(2);

    expect(fileExists('/foo/fidget.txt')).toBeFalsy();
    expect(fileContents('/foo/guitar.js')).toBe('weapon' + EOL);
  });

  it('sends non-matching files to the recycle bin with trash=true', async () => {
    setEdits('/foo/guitar.js');

    await run(files('/foo/fidget.txt'), { editor, trash: true }, true);

    expect(trash.default).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledTimes(2);
    expect(fileExists('/foo/fidget.txt')).toBeFalsy();
    expect(fileContents('/foo/guitar.js')).toBe('weapon' + EOL);
  });

  it('cannot run with both overwrite=true and trash=true', async () => {
    await run(files('/foo/fidget.txt'), { editor, overwrite: true, trash: true }, false);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Please use either `overwrite` or `trash` options, but not both at the same time.'
    );
  });
});

describe('Cleanup behaviour', () => {
  it('deletes empty directories with cleanup=true', async () => {
    setEdits('/new_folder/opera.doc');

    await run(files('/bar/opera.doc'), { editor, cleanup: true }, true);

    expect(log).toHaveBeenCalledTimes(2);
    expect(fileExists('/bar')).toBeFalsy();
    expect(fileContents('/new_folder/opera.doc')).toBe('pump' + EOL);
  });

  it('keeps empty directories with cleanup=false', async () => {
    setEdits('/new_folder/opera.doc');

    await run(files('/bar/opera.doc'), { editor, cleanup: false }, true);

    expect(log).toHaveBeenCalledTimes(2);
    expect(fileExists('/bar')).toBeTruthy();
    expect(fileExists('/bar/opera.doc')).toBeFalsy();
    expect(fileContents('/new_folder/opera.doc')).toBe('pump' + EOL);
  });
});

describe('Erroneous input', () => {
  it('cannot run without input', async () => {
    await run([''], { editor }, true);

    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith('No files found matching your input. Aborting.');
  });

  it('cannot run without a matching glob pattern', async () => {
    await run(files('/**/*.psd'), { editor }, true);

    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith('No files found matching your input. Aborting.');
  });

  it.skip('cannot run without a file destination', async () => {
    mockedCp.__setEdits('');

    await run(files('/flag.doc'), { editor }, false);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Error: you must provide a destination for file on line 1.'
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
