import * as fs from 'fs-extra';
import { log } from './log';

export async function validateFiles(
  oldFiles: string[],
  newFiles: string[],
  overwrite: boolean
): Promise<string[]> {
  if (oldFiles.length !== newFiles.length) {
    log.error('Error: edited file paths do not match the length of the original list.' +
      `\nExpected ${oldFiles.length}, got ${newFiles.length}.`);
    return Promise.reject({ success: false });
  }

  const fileMap = {};

  for (let i = 0; i < newFiles.length; ++i) {
    const oldFile = oldFiles[i];
    const newFile = newFiles[i];

    if (!fs.existsSync(oldFile)) {
      log.error(`Error: cannot read/write "${oldFile}".`);
      return Promise.reject({ success: false });
    }

    if (!overwrite && fs.existsSync(newFile)) {
      log.error(`Error: file "${newFile}" already exists.`);
      return Promise.reject({ success: false });
    }

    if (fileMap[newFile]) {
      const lineA = fileMap[newFile].line + 1;
      const lineB = i + 1;
      log.error(`Error: file "${newFile}" declared twice on line ${lineA} and ${lineB}.`);
      return Promise.reject({ success: false });
    }

    fileMap[newFile] = { line: i };
  }

  return newFiles;
}
