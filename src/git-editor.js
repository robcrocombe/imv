const gitconfig = require('gitconfig');

async function getGitEditor() {
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

module.exports = { getGitEditor };
