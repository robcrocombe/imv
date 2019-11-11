import * as rl from 'readline';
import * as trash from 'trash';
import { EOL } from 'os';
import { imv } from '../src/index';
import * as log from '../src/log';
import { setEdits, editor, run, files, fileExists, fileContents } from './helpers';
// eslint-disable-next-line jest/no-mocks-import
import * as mockRl from './__mocks__/readline';

const mockedRl = (rl as unknown) as typeof mockRl;

describe('Overwrite behaviour', () => {
  it('cannot overwrite matching files with overwrite=false', async () => {
    setEdits('/foo/brand_new.js', '/foo/skate.js', '/foo/guitar.js');
    mockedRl.answerYes();

    await run(
      files('/foo/guitar.js', '/foo/skate.js', '/foo/dollar.js'),
      { editor, overwrite: false },
      false
    );

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith('file tests/temp/foo/guitar.js already exists.');
  });

  it('cannot overwrite matching files with overwrite=true', async () => {
    setEdits('/foo/dollar.js', '/foo/skate.js', '/foo/brand_new.js');
    mockedRl.answerYes();

    await run(
      files('/foo/guitar.js', '/foo/skate.js', '/foo/dollar.js'),
      { editor, overwrite: true },
      false
    );

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'cannot rename tests/temp/foo/guitar.js to tests/temp/foo/dollar.js because the new file is also pending movement.'
    );
  });

  it('cannot overwrite non-matching files with overwrite=false', async () => {
    setEdits('/foo/guitar.js');
    mockedRl.answerYes();

    await run(files('/foo/fidget.txt'), { editor, overwrite: false }, false);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith('file tests/temp/foo/guitar.js already exists.');
  });

  it('overwrites non-matching files with overwrite=true', async () => {
    setEdits('/foo/guitar.js');
    mockedRl.answerYes();

    await run(files('/foo/fidget.txt'), { editor, overwrite: true }, true);

    expect(trash.default).toHaveBeenCalledTimes(0);
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.info).toHaveBeenCalledTimes(3);

    expect(fileExists('/foo/fidget.txt')).toBeFalsy();
    expect(fileContents('/foo/guitar.js')).toBe('weapon' + EOL);
  });

  it('aborts overwrite when the user chooses to', async () => {
    setEdits('/foo/guitar.js');
    mockedRl.answerNo();

    await expect(
      imv(files('/foo/fidget.txt'), {
        editor,
        overwrite: true,
      })
    ).rejects.toStrictEqual({
      success: true,
    });

    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.info).toHaveBeenCalledTimes(1);

    expect(fileContents('/foo/fidget.txt')).toBe('weapon' + EOL);
    expect(fileContents('/foo/guitar.js')).toBe('lemon' + EOL);
  });

  it('sends non-matching files to the recycle bin with trash=true', async () => {
    setEdits('/foo/guitar.js');

    await run(files('/foo/fidget.txt'), { editor, trash: true }, true);

    expect(trash.default).toHaveBeenCalledTimes(1);
    expect(log.info).toHaveBeenCalledTimes(2);
    expect(fileExists('/foo/fidget.txt')).toBeFalsy();
    expect(fileContents('/foo/guitar.js')).toBe('weapon' + EOL);
  });

  it('cannot run with both overwrite=true and trash=true', async () => {
    await run(files('/foo/fidget.txt'), { editor, overwrite: true, trash: true }, false);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Please use either `overwrite` or `trash` options, but not both at the same time.'
    );
  });
});
