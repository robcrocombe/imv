import * as fs from 'fs-extra';
import { log } from './log';
import chalk from 'chalk';

interface FileStat {
  line: number;
}

export async function validateFiles(
  oldFiles: string[],
  newFiles: string[],
  overwrite: boolean
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

  const fileMap: Record<string, FileStat> = {};

  for (let i = 0; i < newFiles.length; ++i) {
    const oldFile = oldFiles[i];
    const newFile = newFiles[i];

    if (!fs.existsSync(oldFile)) {
      log.error(`Error: cannot read/write ${chalk.white(oldFile)}.`);
      return Promise.reject({ success: false });
    }

    if (oldFile !== newFile && !overwrite && fs.existsSync(newFile)) {
      log.error(`Error: file ${chalk.white(newFile)} already exists.`);
      return Promise.reject({ success: false });
    }

    if (fileMap[newFile]) {
      const lineA = chalk.white((fileMap[newFile].line + 1).toString());
      const lineB = chalk.white((i + 1).toString());
      log.error(
        `Error: file ${chalk.white(newFile)} declared twice on line ${lineA} and ${lineB}.`
      );
      return Promise.reject({ success: false });
    }

    fileMap[newFile] = { line: i };
  }

  return newFiles;
}
