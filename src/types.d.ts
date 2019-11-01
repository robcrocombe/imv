interface Options {
  editor?: string;
  overwrite?: boolean;
  trash?: boolean;
  cleanup?: boolean;
}

interface RunResult {
  success: boolean;
}

interface MoveResult extends RunResult {
  error?: any;
}

interface FileStat {
  line: number;
}

type FileMove = () => Promise<void>;
