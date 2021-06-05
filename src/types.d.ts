type FileMove = () => Promise<void>;

interface Options {
  editor?: string;
  overwrite?: boolean;
  trash?: boolean;
  keepEmpty?: boolean;
  ignore?: string;
  gitignore?: boolean;
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
