interface Options {
  editor?: string;
  overwrite?: boolean;
  trash?: boolean;
  cleanup?: boolean;
}

interface RunResult {
  success: boolean;
}

interface FileStat {
  line: number;
}
