import 'jest';
import * as fs from 'fs-extra';
import * as cp from 'child_process';
import * as rl from 'readline';
import * as path from 'path';
import * as trash from 'trash';
import rimraf from 'rimraf';
import chalk from 'chalk';
import { __SET_TEST_PARENT_PATH } from '../src/helpers';
/* eslint-disable jest/no-mocks-import */
import * as mockCp from './__mocks__/child_process';
import * as mockRl from './__mocks__/readline';
/* eslint-enable jest/no-mocks-import */
import { tempDir, editor } from './helpers';

chalk.enabled = false;

jest.mock('child_process');
jest.mock('readline');
jest.spyOn(trash, 'default');

// Use `mock` to hide imv logs
// Use `spyOn` to view imv logs
jest.mock('../src/log');
// jest.spyOn(log, 'info');
// jest.spyOn(log, 'warn');
// jest.spyOn(log, 'error');
// jest.spyOn(log, 'printProgress').mockImplementation();

const mockedRl = (rl as unknown) as typeof mockRl;
const mockedCp = (cp as unknown) as typeof mockCp;

// To avoid a dependency on files outside the tempDir,
// set it as the "root" path in our helper functions so
// we can test what happens when we try to move outside files.
__SET_TEST_PARENT_PATH(path.resolve(tempDir));

beforeAll(() => {
  mockedCp.__setEditor(editor);
});

beforeEach(() => {
  mockedCp.__setEdits(undefined);
  fs.copySync('./tests/fixtures', tempDir);
  jest.clearAllMocks();
  mockedRl.answerNo();
});

afterEach(cb => {
  rimraf(tempDir, cb);
});
