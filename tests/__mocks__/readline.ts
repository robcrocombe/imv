import 'jest';

export const questionMock = jest.fn().mockImplementation((_q, cb) => {
  cb('y');
});

const close = () => {};
const cursorTo = jest.fn();
const createInterface = jest.fn().mockReturnValue({ question: questionMock, close });

export default {
  cursorTo,
  createInterface,
};
