import globby from 'globby';
import * as tmp from 'tmp';
import * as fs from 'fs-extra';
import * as path from 'path';
import { EOL } from 'os';
import { execSync } from 'child_process';
import { getGitEditor } from './git-editor';
import { validateFiles } from './validate-files';
import { log } from './log';

interface Options {
  editor?: string;
  overwrite?: boolean;
  cleanup?: boolean;
}

export async function run(input: string[], args: Options): Promise<boolean> {
  tmp.setGracefulCleanup();

  const oldFiles: string[] = input.length > 1 ? input : globby.sync(input);

  if (!oldFiles || !oldFiles.length) {
    log.warn(`No files found matching "${input.join(', ')}". Aborting.`);
    return Promise.reject({ success: true });
  }

  const dir = tmp.dirSync({ unsafeCleanup: true });

  const opts: Options = {
    editor: args.editor || getGitEditor(),
    overwrite: !!args.overwrite,
    cleanup: !!args.cleanup,
  };

  if (!opts.editor) {
    log.error(
      'Your git `config.editor` variable is not set or you are missing `--editor` argument.'
    );
    return Promise.reject({ success: false });
  }

  return promptForNewFiles(oldFiles, dir, opts)
    .then(newFiles => {
      return validateFiles(oldFiles, newFiles, opts.overwrite);
    })
    .then(newFiles => {
      return moveFiles(oldFiles, newFiles, opts.overwrite);
    })
    .then(() => {
      log('✨ Done!');
      return true;
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

function moveFiles(oldFiles: string[], newFiles: string[], overwrite: boolean): Promise<void[]> {
  const movePromises: Promise<void>[] = [];

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
