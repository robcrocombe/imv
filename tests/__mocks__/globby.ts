import minimatch from 'minimatch';
import * as mockFs from './fs-extra';

function sync(glob: string[]) {
  return minimatch.match(Object.keys(mockFs.fileSystem), glob[0], { matchBase: true });
}

export default { sync };
