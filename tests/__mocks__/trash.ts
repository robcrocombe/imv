import * as fs from 'fs-extra';

// Is there a better way of testing `trash` without actually sending
// files to the trash bin (which is outside the test directory)?
export default function trash(file: string): Promise<void> {
  return fs.remove(file);
}
