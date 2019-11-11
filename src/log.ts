import chalk from 'chalk';
import readline from 'readline';

const errorRegex = /^\s*Error:\s*/;

export function info(text: string) {
  console.log(text);
}

export function warn(text: string) {
  console.log(chalk.yellow(text));
}

export function error(text: string) {
  const message = text.replace(errorRegex, '');
  console.log(chalk.red('Error:'), message);
}

export function printProgress(current: number, total: number) {
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(`${current}/${total} Complete`);
}
