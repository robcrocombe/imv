// eslint-disable-next-line jest/no-jest-import
const Sequencer = require('@jest/test-sequencer').default;

// https://jestjs.io/docs/en/next/configuration#testsequencer-string
// Sort test paths alphabetically
class CustomSequencer extends Sequencer {
  sort(tests) {
    const copyTests = Array.from(tests);
    return copyTests.sort((testA, testB) => (testA.path > testB.path ? 1 : -1));
  }
}

module.exports = CustomSequencer;
