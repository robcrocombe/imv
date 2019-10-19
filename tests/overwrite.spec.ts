import 'jest';
import mock from 'mock-fs';

beforeAll(() => {
  mock({
    'files': {
      'fidgit.txt': 'text1',
    },
  });
});

afterAll(() => {
  mock.restore();
});

test('adds 1 + 2 to equal 3', () => {
  expect(1 + 2).toBe(3);
});
