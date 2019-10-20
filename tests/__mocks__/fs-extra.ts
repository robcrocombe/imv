import * as assert from 'assert';
import { MoveOptions } from 'fs-extra';

export let fileSystem: Record<string, string>;

export function __mockFs(system: Record<string, string>) {
  fileSystem = system;
}

export function __resetFs() {
  fileSystem = undefined;
}

export function __getFile(path: string): string {
  return fileSystem[path];
}

export function existsSync(path: string): boolean {
  return !!fileSystem[path];
}

export function writeFileSync(path: string, content: string, encoding: string) {
  assert.strictEqual(encoding, 'utf8', 'fs: Encoding must be utf8');
  fileSystem[path] = content;
}

export function readFileSync(path: string, encoding: string): string {
  assert.strictEqual(encoding, 'utf8', 'fs: Encoding must be utf8');
  return fileSystem[path];
}

export function move(oldPath: string, newPath: string, opts: MoveOptions): Promise<void> {
  if (!opts.overwrite && fileSystem[newPath]) {
    return Promise.reject(new Error(`fs: File "${newPath}" already exists`));
  }

  if (!fileSystem[oldPath]) {
    return Promise.reject(new Error(`fs: File "${oldPath}" doesn't exist`));
  }

  fileSystem[newPath] = fileSystem[oldPath];
  fileSystem[oldPath] = null;

  return Promise.resolve();
}
