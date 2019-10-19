import globby from 'globby';
import * as tmp from 'tmp';
import * as fs from 'fs-extra';
import * as path from 'path';
import { EOL } from 'os';
import { execSync } from 'child_process';
import { getGitEditor } from './git-editor';
import { validateFiles } from './validate-files';
import { log } from './log';

export async function run(input, opts): Promise<boolean> {
  tmp.setGracefulCleanup();

  const oldFiles: string[] = input.length > 1 ? input : globby.sync(input);

  if (!oldFiles || !oldFiles.length) {
    log.warn(`No files found matching "${input.join(', ')}". Aborting.`);
    return true;
  }

  const dir = tmp.dirSync({ unsafeCleanup: true });

  const editor = opts.editor || getGitEditor();
  const overwrite = !!opts.overwrite;

  if (!editor) {
    log.error(
      'Your git `config.editor` variable is not set or you are missing `--editor` argument.'
    );
    return false;
  }

  const renamePromises = [];

  try {
    const tmpFile = path.join(dir.name, 'FILES');
    fs.writeFileSync(tmpFile, oldFiles.join(EOL) + EOL, 'utf8');

    // Open files for renaming
    execSync(`${editor} ${tmpFile}`);

    const output = fs.readFileSync(tmpFile, 'utf8');
    const newFiles = output.trim().split(EOL);

    if (oldFiles.join() === newFiles.join()) {
      log.warn('Files unchanged. Aborting.');
      return true;
    }

    validateFiles(oldFiles, newFiles, overwrite);

    for (let i = 0; i < newFiles.length; ++i) {
      const oldFile = oldFiles[i];
      const newFile = newFiles[i];

      const p = fs.move(oldFile, newFile, { overwrite });

      renamePromises.push(p);
    }
  } catch (err) {
    log.warn(err);
    return false;
  }

  return Promise.all(renamePromises).then(() => {
    log('✨ Done!');
    return true;
  });
}
