import 'jest';
import { mocked } from 'ts-jest/utils';
import * as fs from 'fs-extra';
import * as cp from 'child_process';
import { EOL } from 'os';
import { imv } from '../src/index';
import { log } from '../src/log';
import * as mockFs from './__mocks__/fs-extra';
import * as mockCp from './__mocks__/child_process';

jest.mock('child_process');
jest.mock('../src/log');

const mockedFs = (fs as unknown) as typeof mockFs;
const mockedCp = (cp as unknown) as typeof mockCp;
const mockedLog = mocked(log);
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
  mockedLog.mockClear();
});

it('renames a single file', async () => {
  setEdits(['./foo/fidget2.txt']);

  await expect(imv(['./foo/fidget.txt'], { editor })).resolves.toBe(true);

  expect(mockedFs.__getFile('./foo/fidget.txt')).toBeNull();
  expect(mockedFs.__getFile('./foo/fidget2.txt')).toBe('weapon');

  expect(log).toBeCalledTimes(1);
});

it('renames using a glob pattern', async () => {
  setEdits(['./flag2.png', './bar2/opera.png', './foo/myth.jpg']);

  await expect(imv(['./**/*.png'], { editor })).resolves.toBe(true);

  expect(mockedFs.__getFile('./flag.png')).toBeNull();
  expect(mockedFs.__getFile('./flag2.png')).toBe('island');

  expect(mockedFs.__getFile('./bar/opera.png')).toBeNull();
  expect(mockedFs.__getFile('./bar2/opera.png')).toBe('pump');

  expect(mockedFs.__getFile('./foo/myth.png')).toBeNull();
  expect(mockedFs.__getFile('./foo/myth.jpg')).toBe('tram');

  expect(log).toBeCalledTimes(1);
});

function setEdits(arr: string[]) {
  mockedCp.__setEdits(arr.join(EOL) + EOL);
}
