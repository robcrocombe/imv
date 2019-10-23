import globby from 'globby';
import * as tmp from 'tmp';
import * as fs from 'fs-extra';
import * as path from 'path';
import { EOL } from 'os';
import { execSync } from 'child_process';
import { getGitEditor } from './git-editor';
import { validateFiles } from './validate-files';
import { log } from './log';

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

  const oldFiles: string[] = input.length > 1 ? input : globby.sync(input);

  if (!oldFiles || !oldFiles.length) {
    log.warn(`No files found matching "${input.join(', ')}". Aborting.`);
    return Promise.reject({ success: true });
  }

  const dir = tmp.dirSync({ unsafeCleanup: true });

  return promptForNewFiles(oldFiles, dir, opts)
    .then(newFiles => {
      return validateFiles(oldFiles, newFiles, opts);
    })
    .then(newFiles => {
      return moveFiles(oldFiles, newFiles, opts);
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

function moveFiles(oldFiles: string[], newFiles: string[], opts: Options): Promise<void[]> {
  const movePromises: Promise<void>[] = [];
  const overwrite = opts.overwrite;

  for (let i = 0; i < newFiles.length; ++i) {
    const oldFile = oldFiles[i];
    const newFile = newFiles[i];

    if (oldFile !== newFile) {
      const p = fs.move(oldFile, newFile, { overwrite });
      movePromises.push(p);
    }
  }

  return Promise.all(movePromises);
}
