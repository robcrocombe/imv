type FileMove = () => Promise<void>;

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

interface ValidationResult {
  fileMoves: FileMove[];
  overwrites: string[];
}

interface FileStat {
  line: number;
}
