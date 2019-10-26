import * as fs from 'fs-extra';
import * as path from 'path';

// rosettacode.org/wiki/Find_common_directory_path#JavaScript
export function findCommonParentDir(files: string[]): string {
  // Given an array of strings, return an array of arrays, containing the
  // strings split at the given separator
  const splitStrings = (a, sep = '/') => a.map(i => i.split(sep));

  // Given an index number, return a function that takes an array and returns
  // the element at the given index
  const elAt = i => a => a[i];

  // Transpose an array of arrays, e.g:
  // [['a', 'b', 'c'], ['A', 'B', 'C'], [1, 2, 3]] ->
  // [['a', 'A', 1], ['b', 'B', 2], ['c', 'C', 3]]
  const rotate = a => a[0].map((_e, i) => a.map(elAt(i)));

  // Checks of all the elements in the array are the same
  const allElementsEqual = arr => arr.every(e => e === arr[0]);

  const commonDir = rotate(splitStrings(files, path.sep))
    .filter(allElementsEqual)
    .map(elAt(0))
    .join(path.sep);

  if (
    notChildPath(commonDir) ||
    !fs.existsSync(commonDir) ||
    !fs.lstatSync(commonDir).isDirectory()
  ) {
    return process.cwd();
  } else {
    return commonDir;
  }
}

// github.com/sindresorhus/is-path-inside
export function notChildPath(dir: string): boolean {
  let childPath = path.resolve(dir);
  let parentPath = process.cwd();

  if (process.platform === 'win32') {
    childPath = childPath.toLowerCase();
    parentPath = parentPath.toLowerCase();
  }

  if (childPath === parentPath) {
    return false;
  }

  childPath += path.sep;
  parentPath += path.sep;

  return !childPath.startsWith(parentPath)
}
