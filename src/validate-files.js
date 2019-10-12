const fs = require('fs-extra');
const path = require('path');

function validateFiles(oldFiles, newFiles) {
  if (oldFiles.length !== newFiles.length) {
    return (
      'edited file paths do not match the length of the original list.' +
      `\nExpected ${oldFiles.length}, got ${newFiles.length}.`
    );
  }

  const fileMap = {};

  for (let i = 0; i < newFiles.length; ++i) {
    const oldFile = oldFiles[i];
    const newFile = newFiles[i];

    try {
      fs.accessSync(oldFile, fs.constants.R_OK | fs.constants.W_OK);
    } catch (e) {
      return `cannot read/write "${oldFile}".`;
    }

    try {
      fs.accessSync(newFile, fs.constants.R_OK | fs.constants.W_OK);
    } catch (e) {
      return `file "${newFile}" already exists.`;
    }

    if (fileMap[newFile]) {
      return `file "${newFile}" declared twice on line ${fileMap[newFile].line} and ${i}.`;
    }

    fileMap[newFile] = { line: i };
  }
}

module.exports = { validateFiles };
