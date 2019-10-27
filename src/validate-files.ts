import * as fs from 'fs-extra';
import chalk from 'chalk';
import { log } from './log';
import { notChildPath } from './helpers';

export async function validateFiles(
  oldFiles: string[],
  newFiles: string[],
  opts: Options
): Promise<void> {
  if (oldFiles.length !== newFiles.length) {
    const oldLength = chalk.white(oldFiles.length.toString());
    const newLength = chalk.white(newFiles.length.toString());
    log.error(
      'Error: edited file paths do not match the length of the original list.' +
        `\nExpected ${oldLength}, got ${newLength}.`
    );
    return Promise.reject({ success: false });
  }

  const okToOverwrite = opts.overwrite || opts.trash;
  const fileSeen: Record<string, FileStat> = {};
  const existingFiles: Record<string, true> = oldFiles.reduce((map, key) => {
    map[key] = true;
    return map;
  }, {});

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

    if (oldFile !== newFile && existingFiles[newFile]) {
      const oldFmtd = chalk.white(oldFile);
      const newFmtd = chalk.white(newFile);
      log.error(
        `Error: cannot rename ${oldFmtd} to ${newFmtd} because the new file is also pending movement.`
      );
      return Promise.reject({ success: false });
    }

    fileSeen[newFile] = { line: i };
  }
}
