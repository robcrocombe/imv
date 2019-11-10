import { EOL } from 'os';
import * as log from '../src/log';
import { setEdits, editor, run, files, fileExists, fileContents } from './helpers';

describe('Basic functionality', () => {
  it('moves a single file', async () => {
    setEdits('/foo/fidget2.txt');

    await run(files('/foo/fidget.txt'), { editor }, true);

    expect(fileExists('/foo/fidget.txt')).toBeFalsy();
    expect(fileContents('/foo/fidget2.txt')).toBe('weapon' + EOL);

    expect(log.info).toHaveBeenCalledTimes(2);
    expect(log.info).toHaveBeenLastCalledWith('✨ Done!');
  });

  it('moves using a glob pattern', async () => {
    setEdits('/flag2.doc', '/bar2/opera.doc', '/foo/myth.jpg');

    await run(files('/**/*.doc'), { editor }, true);

    expect(fileExists('/flag.doc')).toBeFalsy();
    expect(fileContents('/flag2.doc')).toBe('island' + EOL);

    expect(fileExists('/bar/opera.doc')).toBeFalsy();
    expect(fileContents('/bar2/opera.doc')).toBe('pump' + EOL);

    expect(fileExists('/foo/myth.doc')).toBeFalsy();
    expect(fileContents('/foo/myth.jpg')).toBe('tram' + EOL);

    expect(log.info).toHaveBeenCalledTimes(2);
    expect(log.info).toHaveBeenLastCalledWith('✨ Done!');
  });
});
