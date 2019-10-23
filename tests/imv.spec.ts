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

it('renames a single file', async () => {
  setEdits(['./foo/fidget2.txt']);

  await expect(imv(['./foo/fidget.txt'], { editor })).resolves.toStrictEqual({ success: true });

  expect(mockedFs.__getFile('./foo/fidget.txt')).toBeNull();
  expect(mockedFs.__getFile('./foo/fidget2.txt')).toBe('weapon');

  expect(log).toHaveBeenCalledTimes(1);
});

it('renames using a glob pattern', async () => {
  setEdits(['./flag2.png', './bar2/opera.png', './foo/myth.jpg']);

  await expect(imv(['./**/*.png'], { editor })).resolves.toStrictEqual({ success: true });

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

  await expect(
    imv(['./foo/guitar.js', './foo/skate.js', './foo/dollar.js'], { editor, overwrite: false })
  ).rejects.toStrictEqual({ success: false });

  expect(log.error).toHaveBeenCalledTimes(1);
  expect(log.error).toHaveBeenCalledWith('Error: file ./foo/guitar.js already exists.');
});

it('cannot overwrite matching files with overwrite=true', async () => {
  setEdits(['./foo/brand_new.js', './foo/skate.js', './foo/guitar.js']);

  await expect(
    imv(['./foo/guitar.js', './foo/skate.js', './foo/dollar.js'], { editor, overwrite: true })
  ).rejects.toStrictEqual({ success: false });

  expect(log.error).toHaveBeenCalledTimes(1);
  expect(log.error).toHaveBeenCalledWith(
    'Error: cannot rename ./foo/dollar.js to ./foo/guitar.js because the new file is also pending movement.'
  );
});

it.todo('cannot overwrite non-matching files with overwrite=false');

it.todo('overwrites non-matching files with overwrite=true');

it.todo('sends non-matching files to the recycle bin with trash=true');

it.todo('cannot execute with both overwrite=true and trash=true');

it.todo('cannot execute without input');

it.todo('cannot execute without a matching glob pattern');

function setEdits(arr: string[]) {
  mockedCp.__setEdits(arr.join(EOL) + EOL);
}
