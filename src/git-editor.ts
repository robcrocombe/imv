import gitConfigPath from 'git-config-path';
import * as ini from 'ini';
import * as fs from 'fs-extra';

export function getGitEditor(): string {
  const localPath = gitConfigPath();

  if (localPath) {
    const config = ini.parse(fs.readFileSync(localPath, 'utf-8'));
    return config && config.core && config.core.editor;
  }

  const globalPath = gitConfigPath('global');

  if (globalPath) {
    const config = ini.parse(fs.readFileSync(globalPath, 'utf-8'));
    return config && config.core && config.core.editor;
  }
}
