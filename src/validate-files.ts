import * as fs from 'fs-extra';
// import * as path from 'path';

export function validateFiles(oldFiles, newFiles) {
  if (oldFiles.length !== newFiles.length) {
    throw (
      'Error: edited file paths do not match the length of the original list.' +
      `\nExpected ${oldFiles.length}, got ${newFiles.length}.`
    );
  }

  const fileMap = {};

  for (let i = 0; i < newFiles.length; ++i) {
    const oldFile = oldFiles[i];
    const newFile = newFiles[i];

    if (!fs.existsSync(oldFile)) {
      throw `Error: cannot read/write "${oldFile}".`;
    }

    if (fs.existsSync(newFile)) {
      throw `Error: file "${newFile}" already exists.`;
    }

    if (fileMap[newFile]) {
      throw `Error: file "${newFile}" declared twice on line ${fileMap[newFile].line} and ${i}.`;
    }

    fileMap[newFile] = { line: i };
  }

  return fileMap;
}
