import * as fs from 'fs-extra';
import * as path from 'path';
import * as tmp from 'tmp';
import normalizePath from 'normalize-path';
import deleteEmpty from 'delete-empty';
import globby from 'globby';
import { EOL } from 'os';
import { execSync } from 'child_process';
import { findCommonParentDir } from './helpers';
import { getGitEditor } from './git-editor';
import * as log from './log';
import { validateFiles } from './validate-files';

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

  const sanitisedInput = input && input.filter(Boolean).map(p => normalizePath(p));
  const oldFiles: string[] =
    sanitisedInput.length > 1 ? sanitisedInput : globby.sync(sanitisedInput, { dot: true });

  if (!oldFiles || !oldFiles.length) {
    log.warn(`No files found matching your input. Aborting.`);
    return { success: true };
  }

  const dir = tmp.dirSync({ unsafeCleanup: true });
  let newFiles: string[];

  return promptForNewFiles(oldFiles, dir, opts)
    .then(res => {
      newFiles = res;
      return validateFiles(oldFiles, newFiles, opts);
    })
    .then(fileMoves => {
      return moveFiles(fileMoves);
    })
    .then(() => {
      if (opts.cleanup) {
        const allFilePaths = [...oldFiles, ...newFiles];
        return cleanup(allFilePaths);
      }
    })
    .then(() => {
      log.info('✨ Done!');
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

async function moveFiles(fileMoves: FileMove[]): Promise<RunResult> {
  const movePromises: Promise<MoveResult>[] = [];
  let progress = 0;
  log.printProgress(progress, fileMoves.length);

  for (let i = 0; i < fileMoves.length; ++i) {
    const move = fileMoves[i];

    const p = move()
      .then(() => {
        progress++;
        log.printProgress(progress, fileMoves.length);
        return { success: true };
      })
      .catch(err => {
        const error = typeof err === 'object' ? err.stack || err.message : err;
        return { success: false, error };
      });

    movePromises.push(p);
  }

  return Promise.all(movePromises).then(res => {
    // Newline between progress and next message
    log.info('');

    const errors = res.filter(r => r.error).map(e => e.error);

    if (errors.length) {
      log.error(errors.join(EOL));
      return Promise.reject({ success: false });
    } else {
      return { success: true };
    }
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
