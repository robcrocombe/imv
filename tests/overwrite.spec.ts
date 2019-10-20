import 'jest';
import * as fs from 'fs-extra';
import * as cp from 'child_process';
import { run } from '../src/index';
import * as mockFs from './__mocks__/fs-extra';
import * as mockCp from './__mocks__/child_process';

jest.mock('child_process');

const mockedFs = (fs as unknown) as typeof mockFs;
const mockedCp = (cp as unknown) as typeof mockCp;

beforeAll(() => {
  mockedFs.__mockFs({
    './files/fidget.txt': 'abc',
  });
  mockedCp.__setEditor('subl');
});

afterAll(() => {
  mockedFs.__resetFs();
});

test('works', async () => {
  mockedCp.__setEdits('./files/spinner.txt\n')

  await run(['./files/fidget.txt'], { editor: 'subl' });

  expect(mockedFs.__getFile('./files/spinner.txt')).toBe('abc');
  expect(mockedFs.__getFile('./files/fidget.txt')).toBeNull();
});
