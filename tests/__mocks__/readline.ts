import 'jest';

let answer: string;

export function answerYes() {
  answer = 'y';
}

export function answerNo() {
  answer = 'n';
}

const questionMock = jest.fn().mockImplementation((_q, cb) => {
  cb(answer);
});
const close = () => void 0;
const cursorTo = jest.fn();
const createInterface = jest.fn().mockReturnValue({ question: questionMock, close });

export default {
  cursorTo,
  createInterface,
};
