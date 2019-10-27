import * as fs from 'fs-extra';
import * as ini from 'ini';
import gitConfigPath from 'git-config-path';

export function getGitEditor(): string {
  let editor: string;

  const localPath = gitConfigPath();
  if (localPath) {
    editor = readConfig(localPath);
  }

  const globalPath = gitConfigPath('global');
  if (!editor && globalPath) {
    editor = readConfig(globalPath);
  }

  return editor;
}

function readConfig(path: string): string {
  const config = ini.parse(fs.readFileSync(path, 'utf-8'));
  return config && config.core && config.core.editor;
}
