import * as fs from 'fs-extra';
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
  // const filePlans: FilePlan[] = [];
  const okToOverwrite = opts.overwrite || opts.trash;

  for (let i = 0; i < newFiles.length; ++i) {
    const oldFile = oldFiles[i];
    const newFile = newFiles[i];

    if (!fs.existsSync(oldFile)) {
      log.error(`Error: cannot read/write ${chalk.white(oldFile)}.`);
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

    fileSeen[newFile] = { line: i };
  }

  return newFiles;
}
