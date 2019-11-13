/// <reference path="../src/types.d.ts" />

import * as path from 'path';
import * as fs from 'fs-extra';
import * as cp from 'child_process';
import { EOL } from 'os';
import { imv } from '../src/index';
// eslint-disable-next-line jest/no-mocks-import
import * as mockCp from './__mocks__/child_process';

const mockedCp = (cp as unknown) as typeof mockCp;

export const editor = 'subl';
export const tempDir = './tests/temp';

export function file(p: string): string {
  return path.join(tempDir, p);
}

export function files(...args: string[]): string[] {
  return args.map(file);
}

export function setEdits(...arr: string[]) {
  mockedCp.__setEdits(files(...arr).join(EOL) + EOL);
}

export function fileExists(p: string): boolean {
  return fs.existsSync(file(p));
}

export function fileContents(p: string): string {
  return fs.readFileSync(file(p), 'utf8');
}

export function run(files: string[], opts: Options, success: boolean): Promise<any> {
  const p = imv(files, opts).catch(e => {
    // Jest swallows stack traces so log it before passing to expect()
    if (e && e.stack) {
      console.log(e.stack);
    }
    throw e;
  });

  return expect(p)[success ? 'resolves' : 'rejects'].toStrictEqual({ success });
}
