import globby from 'globby';
import * as tmp from 'tmp';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import trash from 'trash';
import deleteEmpty from 'delete-empty';
import { EOL } from 'os';
import { execSync } from 'child_process';
import { getGitEditor } from './git-editor';
import { validateFiles } from './validate-files';
import { log, printProgress } from './log';
import { findCommonParentDir } from './helpers';

export async function imv(input: string[], args: Options): Promise<RunResult> {
  tmp.setGracefulCleanup();

  const opts: Options = {
    editor: args.editor || getGitEditor(),
    overwrite: !!args.overwrite,
    trash: !!args.trash,
    cleanup: !!args.cleanup,
  };

  if (typeof opts.editor !== 'string' || !opts.editor.trim()) {
    log.error(
      'Your git `config.editor` variable is not set or you are missing the `editor` argument.'
    );
    return Promise.reject({ success: false });
  }

  if (opts.overwrite && opts.trash) {
    log.error('Please use either `overwrite` or `trash` options, but not both at the same time.');
    return Promise.reject({ success: false });
  }

  const sanitisedInput = input && input.filter(Boolean);
  const oldFiles: string[] =
    sanitisedInput.length > 1 ? sanitisedInput : globby.sync(sanitisedInput, { dot: true });

  if (!oldFiles || !oldFiles.length) {
    log.warn(`No files found matching "${chalk.white(input.join(', '))}". Aborting.`);
    return { success: true };
  }

  const dir = tmp.dirSync({ unsafeCleanup: true });
  let newFiles: string[];

  return promptForNewFiles(oldFiles, dir, opts)
    .then(res => {
      newFiles = res;
      return validateFiles(oldFiles, newFiles, opts);
    })
    .then(() => {
      return moveFiles(oldFiles, newFiles, opts);
    })
    .then(() => {
      if (opts.cleanup) {
        const allFilePaths = [...oldFiles, ...newFiles];
        return cleanup(allFilePaths);
      }
    })
    .then(() => {
      log('✨ Done!');
      return { success: true };
    });
}

async function promptForNewFiles(
  oldFiles: string[],
  dir: tmp.DirResult,
  opts: Options
): Promise<string[]> {
  const tmpFile = path.join(dir.name, 'FILES');
  fs.writeFileSync(tmpFile, oldFiles.join(EOL) + EOL, 'utf8');

  // Open files for renaming
  execSync(`${opts.editor} ${tmpFile}`);

  const output = fs.readFileSync(tmpFile, 'utf8');
  const newFiles = output.trim().split(EOL);

  if (oldFiles.join() === newFiles.join()) {
    log.warn('Files unchanged. Aborting.');
    return Promise.reject({ success: true });
  }

  return newFiles;
}

async function moveFiles(oldFiles: string[], newFiles: string[], opts: Options): Promise<void> {
  const movePromises: Promise<void>[] = [];
  const overwrite = opts.overwrite;
  let progress = 0;
  printProgress(progress, newFiles.length);

  for (let i = 0; i < newFiles.length; ++i) {
    const oldFile = oldFiles[i];
    const newFile = newFiles[i];

    if (oldFile !== newFile) {
      if (opts.trash && fs.existsSync(newFile)) {
        await trash(newFile);
      }

      const p = fs.move(oldFile, newFile, { overwrite }).then(() => {
        progress++;
        printProgress(progress, newFiles.length);
      });
      movePromises.push(p);
    } else {
      progress++;
      printProgress(progress, newFiles.length);
    }
  }

  return Promise.all(movePromises)
    .then(() => log(''))
    .catch(e => {
      // Newline between progress and error message
      log('');
      throw e;
    });
}

// To try and avoid checking wide dir trees and dirs we don't
// care about, find the nearest common parent directory to the
// affected files.
// E.g. we don't want to mess with node_modules if we run:
// $> imv ./foo/**/*.js
// from a JS repo, just the dirs inside ./foo/
function cleanup(files): Promise<void> {
  return deleteEmpty(findCommonParentDir(files));
}
