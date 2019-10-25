import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { log } from './log';

export async function validateFiles(
  oldFiles: string[],
  newFiles: string[],
  opts: Options
): Promise<string[]> {
  if (oldFiles.length !== newFiles.length) {
    const oldLength = chalk.white(oldFiles.length.toString());
    const newLength = chalk.white(newFiles.length.toString());
    log.error(
      'Error: edited file paths do not match the length of the original list.' +
        `\nExpected ${oldLength}, got ${newLength}.`
    );
    return Promise.reject({ success: false });
  }

  const fileSeen: Record<string, FileStat> = {};
  const oldFilesSeen: Record<string, true> = {};
  const okToOverwrite = opts.overwrite || opts.trash;

  for (let i = 0; i < newFiles.length; ++i) {
    const oldFile = oldFiles[i];
    const newFile = newFiles[i];

    if (!fs.existsSync(oldFile)) {
      log.error(`Error: cannot read/write ${chalk.white(oldFile)}.`);
      return Promise.reject({ success: false });
    }

    if (notChildPath(oldFile)) {
      log.error(
        `Error: existing file ${chalk.white(oldFile)} must be a child of the working directory. ` +
          'Please start imv in the directory you want to use it.'
      );
      return Promise.reject({ success: false });
    }

    if (notChildPath(newFile)) {
      log.error(
        `Error: new file ${chalk.white(newFile)} must be a child of the working directory. ` +
          'Please start imv in the directory you want to use it.'
      );
      return Promise.reject({ success: false });
    }

    if (oldFile !== newFile && !okToOverwrite && fs.existsSync(newFile)) {
      log.error(`Error: file ${chalk.white(newFile)} already exists.`);
      return Promise.reject({ success: false });
    }

    if (fileSeen[newFile]) {
      const lineA = chalk.white((fileSeen[newFile].line + 1).toString());
      const lineB = chalk.white((i + 1).toString());
      log.error(
        `Error: file ${chalk.white(newFile)} declared twice on line ${lineA} and ${lineB}.`
      );
      return Promise.reject({ success: false });
    }

    if (oldFilesSeen[newFile]) {
      const oldFmtd = chalk.white(oldFile);
      const newFmtd = chalk.white(newFile);
      log.error(
        `Error: cannot rename ${oldFmtd} to ${newFmtd} because the new file is also pending movement.`
      );
      return Promise.reject({ success: false });
    }

    oldFilesSeen[oldFile] = true;
    fileSeen[newFile] = { line: i };
  }

  return newFiles;
}

function notChildPath(dir: string): boolean {
  const relative = path.relative(process.cwd(), dir);
  return !relative || relative.startsWith('..') || path.isAbsolute(relative);
}
