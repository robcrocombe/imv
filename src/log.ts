import chalk from 'chalk';

export function log(...text: string[]) {
  console.log(...text);
}

log.warn = function(...text: string[]) {
  console.log(chalk.yellow(...text));
};

log.error = function(...text: string[]) {
  console.log(chalk.red(...text));
};
