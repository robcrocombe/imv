import { EOL } from 'os';
import * as log from '../src/log';
import * as rl from 'readline';
// eslint-disable-next-line jest/no-mocks-import
import * as mockRl from './__mocks__/readline';
import { setEdits, editor, run, files, fileExists, fileContents } from './helpers';

const mockedRl = (rl as unknown) as typeof mockRl;

if (process.platform === 'linux') {
  describe('Case-sensitive file system', () => {
    it('moves files that are case-different', async () => {
      setEdits('/Flag.doc', '/foo/dollar.JS', '/Bar/opera.doc');

      await run(
        files('/flag.doc', '/foo/dollar.js', '/bar/opera.doc'),
        { editor, overwrite: false },
        true
      );

      expect(fileExists('/flag.doc')).toBeFalsy();
      expect(fileContents('/Flag.doc')).toBe('island' + EOL);

      expect(fileExists('/foo/dollar.js')).toBeFalsy();
      expect(fileContents('/foo/dollar.JS')).toBe('oven' + EOL);

      expect(fileExists('/bar/opera.doc')).toBeFalsy();
      expect(fileContents('/Bar/opera.doc')).toBe('pump' + EOL);

      expect(log.info).toHaveBeenCalledTimes(2);
      expect(log.info).toHaveBeenLastCalledWith('✨ Done!');
    });
  });
} else {
  describe('Case-insensitive file system', () => {
    it('cannot overwrite case-different files with overwrite=false', async () => {
      setEdits('/Flag.doc', '/foo/dollar.JS', '/Bar/opera.doc');

      await run(
        files('/flag.doc', '/foo/dollar.js', '/bar/opera.doc'),
        { editor, overwrite: false },
        false
      );

      expect(log.error).toHaveBeenCalledTimes(1);
      expect(log.error).toHaveBeenCalledWith(
        'cannot overwrite tests/temp/Flag.doc with the same file in a different case. ' +
          'Please use the `overwrite` flag to perform this action.' +
          EOL +
          'cannot overwrite tests/temp/foo/dollar.JS with the same file in a different case. ' +
          'Please use the `overwrite` flag to perform this action.' +
          EOL +
          'file tests/temp/Bar/opera.doc already exists.'
      );
    });

    it('will overwrite/rename case-different files with overwrite=true', async () => {
      setEdits('/Flag.doc', '/foo/dollar.JS');
      mockedRl.answerYes();

      await run(files('/flag.doc', '/foo/dollar.js'), { editor, overwrite: true }, true);

      expect(fileContents('/Flag.doc')).toBe('island' + EOL);
      expect(fileContents('/foo/dollar.JS')).toBe('oven' + EOL);

      expect(log.info).toHaveBeenCalledTimes(2);
      expect(log.info).toHaveBeenLastCalledWith('✨ Done!');
    });
  });
}
