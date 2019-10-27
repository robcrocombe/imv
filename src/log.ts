import chalk from 'chalk';
import readline from 'readline';

export function log(...text: string[]) {
  console.log(...text);
}

log.warn = function(...text: string[]) {
  console.log(chalk.yellow(...text));
};

log.error = function(...text: string[]) {
  console.log(chalk.red(...text));
};

export function printProgress(current: number, total: number) {
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(`${current}/${total} Complete`);
}
