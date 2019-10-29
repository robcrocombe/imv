import * as fs from 'fs-extra';
import chalk from 'chalk';
import { log } from './log';
import { notChildPath } from './helpers';

/*
 * A note about file system case sensitivity.
 * Depending on the users fs, `fs.existsSync` might return true if the same
 * file exists in a different case, e.g. foobar.js == FooBar.js
 *
 * Here are a list of the possible combinations and outcomes:
 * CI + overwrite:    get case error
 * CI + no overwrite: get file exists error
 * CS + overwrite:    case change detected, fs decides if you get case error with fs.exists
 * CS + no overwrite: fs.exists decides, might get file exists error or not
 */

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

  // TODO: check every file and show all errors like moveFiles()
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

    // File exists error
    if (oldFile !== newFile && !okToOverwrite && fs.existsSync(newFile)) {
      log.error(`Error: file ${chalk.white(newFile)} already exists.`);
      return Promise.reject({ success: false });
    }

    // Case error
    if (okToOverwrite && caseChanged(oldFile, newFile) && fs.existsSync(newFile)) {
      log.error(
        `Error: cannot overwrite ${chalk.white(newFile)} with the same file in a different case.`
      );
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

function caseChanged(oldFile: string, newFile: string): boolean {
  return oldFile !== newFile && oldFile.toLowerCase() === newFile.toLowerCase();
}
