import chalk from 'chalk';
// import readline from 'readline';

export function info(...text: string[]) {
  console.log(...text);
}

export function warn(...text: string[]) {
  console.log(chalk.yellow(...text));
}

export function error(...text: string[]) {
  console.log(chalk.red(...text));
}

export function printProgress(_current: number, _total: number) {
  // readline.cursorTo(process.stdout, 0);
  // process.stdout.write(`${current}/${total} Complete`);
}
