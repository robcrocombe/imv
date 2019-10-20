import * as assert from 'assert';
import { writeFileSync } from './fs-extra';

export let __edits: string;
export let __editor: string;

export function __setEdits(edits: string) {
  __edits = edits;
}

export function __setEditor(editor: string) {
  __editor = editor;
}

export function execSync(command: string) {
  assert.ok(command, 'execSync: must specify a command');

  // Extract file path
  const path = command.substring(__editor.length + 1);

  writeFileSync(path, __edits, 'utf8');
}
