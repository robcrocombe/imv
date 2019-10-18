import * as fs from 'fs-extra';

export function validateFiles(oldFiles: string[], newFiles: string[], overwrite: boolean) {
  if (oldFiles.length !== newFiles.length) {
    throw 'Error: edited file paths do not match the length of the original list.' +
      `\nExpected ${oldFiles.length}, got ${newFiles.length}.`;
  }

  const fileMap = {};

  for (let i = 0; i < newFiles.length; ++i) {
    const oldFile = oldFiles[i];
    const newFile = newFiles[i];

    if (!fs.existsSync(oldFile)) {
      throw `Error: cannot read/write "${oldFile}".`;
    }

    if (!overwrite && fs.existsSync(newFile)) {
      throw `Error: file "${newFile}" already exists.`;
    }

    if (fileMap[newFile]) {
      const lineA = fileMap[newFile].line + 1;
      const lineB = i + 1;
      throw `Error: file "${newFile}" declared twice on line ${lineA} and ${lineB}.`;
    }

    fileMap[newFile] = { line: i };
  }
}
