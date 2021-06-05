import { EOL } from 'os';
import * as log from '../src/log';
import { setEdits, editor, run, files, fileExists, fileContents } from './helpers';

describe('Cleanup behaviour', () => {
  it('keeps empty directories with keepEmpty=true', async () => {
    setEdits('/new_folder/opera.doc');

    await run(files('/bar/opera.doc'), { editor, keepEmpty: true }, true);

    expect(log.info).toHaveBeenCalledTimes(2);
    expect(fileExists('/bar')).toBeTruthy();
    expect(fileExists('/bar/opera.doc')).toBeFalsy();
    expect(fileContents('/new_folder/opera.doc')).toBe('pump' + EOL);
  });

  it('deletes empty directories with keepEmpty=false', async () => {
    setEdits('/new_folder/opera.doc');

    await run(files('/bar/opera.doc'), { editor, keepEmpty: false }, true);

    expect(log.info).toHaveBeenCalledTimes(2);
    expect(fileExists('/bar')).toBeFalsy();
    expect(fileContents('/new_folder/opera.doc')).toBe('pump' + EOL);
  });
});
