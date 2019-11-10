import * as cp from 'child_process';
import { EOL } from 'os';
import * as log from '../src/log';
// eslint-disable-next-line jest/no-mocks-import
import * as mockCp from './__mocks__/child_process';
import { setEdits, editor, run, file, files } from './helpers';

const mockedCp = (cp as unknown) as typeof mockCp;

describe('Erroneous input', () => {
  it('cannot run without input', async () => {
    await run([''], { editor }, true);

    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith('No files found matching your input. Aborting.');
  });

  it('cannot run without a matching glob pattern', async () => {
    await run(files('/**/*.psd'), { editor }, true);

    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith('No files found matching your input. Aborting.');
  });

  it('cannot run without a file destination', async () => {
    mockedCp.__setEdits('');

    await run(files('/flag.doc'), { editor }, false);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Error: you must provide a destination for file on line 1.'
    );
  });

  it('cannot run with existing files outside the cwd', async () => {
    setEdits('/foo/new1.js', '/foo/new2.js');

    await run(['tests/fixtures/flag.doc', 'tests/imv/foo/fidget.txt'], { editor }, false);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Error: existing file tests/fixtures/flag.doc must be a child of the working directory. ' +
        `Please start imv in the directory you want to use it.${EOL}` +
        'Error: cannot read/write tests/imv/foo/fidget.txt.'
    );
  });

  it('cannot run with changed files outside the cwd', async () => {
    mockedCp.__setEdits('tests/fixtures/flag.doc' + EOL);

    await run([file('/flag.doc')], { editor }, false);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Error: new file tests/fixtures/flag.doc must be a child of the working directory. Please start imv in the directory you want to use it.'
    );
  });
});
