import * as fs from 'fs-extra';
import * as path from 'path';
import normalizePath from 'normalize-path';
import trash from 'trash';
import chalk from 'chalk';
import { log } from './log';
import { notChildPath } from './helpers';

/*
 * A note about file system case sensitivity.
 * Depending on the user's fs, `fs.existsSync` might return true if the same
 * file exists in a different case, e.g. foobar.js == FooBar.js
 *
 * To make it simpler, we're going to require the user to use the `overwrite` flag.
 */

// TODO: add overwrite confirm

export async function validateFiles(
  oldFiles: string[],
  newFiles: string[],
  opts: Options
): Promise<FileMove[]> {
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
  const fileMoves: FileMove[] = [];

  // TODO: check every file and show all errors like moveFiles()
  for (let i = 0; i < newFiles.length; ++i) {
    const oldFile = oldFiles[i];
    const newFile = newFiles[i];
    let fileRenamed = false;

    if (!fs.existsSync(oldFile)) {
      log.error(`Error: cannot read/write ${logFile(oldFile)}.`);
      return Promise.reject({ success: false });
    }

    if (notChildPath(oldFile)) {
      log.error(
        `Error: existing file ${logFile(oldFile)} must be a child of the working directory. ` +
          'Please start imv in the directory you want to use it.'
      );
      return Promise.reject({ success: false });
    }

    if (notChildPath(newFile)) {
      log.error(
        `Error: new file ${logFile(newFile)} must be a child of the working directory. ` +
          'Please start imv in the directory you want to use it.'
      );
      return Promise.reject({ success: false });
    }

    // File exists error
    if (oldFile !== newFile && !okToOverwrite && fs.existsSync(newFile)) {
      log.error(`Error: file ${logFile(newFile)} already exists.`);
      return Promise.reject({ success: false });
    }

    // Case error
    if (isRename(oldFile, newFile) && fs.existsSync(newFile)) {
      if (opts.overwrite) {
        fileRenamed = true;
      } else {
        log.error(
          `Error: cannot overwrite ${logFile(newFile)} with the same file in a different case. ` +
            'Please use the `overwrite` flag to perform this action.'
        );
        return Promise.reject({ success: false });
      }
    }

    if (fileSeen[newFile]) {
      const lineA = chalk.white((fileSeen[newFile].line + 1).toString());
      const lineB = chalk.white((i + 1).toString());
      log.error(`Error: file ${logFile(newFile)} declared twice on line ${lineA} and ${lineB}.`);
      return Promise.reject({ success: false });
    }

    if (oldFile !== newFile && existingFiles[newFile]) {
      const oldFmtd = logFile(oldFile);
      const newFmtd = logFile(newFile);
      log.error(
        `Error: cannot rename ${oldFmtd} to ${newFmtd} because the new file is also pending movement.`
      );
      return Promise.reject({ success: false });
    }

    fileSeen[newFile] = { line: i };

    if (oldFile === newFile) {
      fileMoves.push(() => unchanged());
    } else if (fileRenamed) {
      fileMoves.push(() => rename(oldFile, newFile));
    } else if (opts.trash) {
      fileMoves.push(() => moveWithTrash(oldFile, newFile));
    } else {
      fileMoves.push(() => move(oldFile, newFile, opts.overwrite));
    }
  }

  return fileMoves;
}

function isRename(oldFile: string, newFile: string): boolean {
  return (
    oldFile.toLowerCase() === newFile.toLowerCase() &&
    path.dirname(oldFile) === path.dirname(newFile) &&
    path.basename(oldFile) !== path.basename(newFile)
  );
}

function logFile(file: string): string {
  return file && chalk.white(normalizePath(file));
}

function move(oldFile: string, newFile: string, overwrite: boolean): Promise<void> {
  return fs.move(oldFile, newFile, { overwrite });
}

function moveWithTrash(oldFile: string, newFile: string): Promise<void> {
  return trash(newFile).then(() => {
    return fs.move(oldFile, newFile, { overwrite: false });
  });
}

function rename(oldFile: string, newFile: string): Promise<void> {
  return fs.rename(oldFile, newFile);
}

function unchanged() {
  return Promise.resolve();
}
