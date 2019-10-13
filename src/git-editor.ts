import * as gitconfig from 'gitconfig';

export async function getGitEditor() {
  const localPromise = gitconfig.get('core', {
    location: 'local',
  });
  const globalPromise = gitconfig.get('core', {
    location: 'global',
  });

  return Promise.all([localPromise, globalPromise]).then(([localConfig, globalConfig]) => {
    return (localConfig && localConfig.editor) || (globalConfig && globalConfig.editor);
  });
}
