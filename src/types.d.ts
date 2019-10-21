interface Options {
  editor?: string;
  overwrite?: boolean;
  trash?: boolean;
  cleanup?: boolean;
}

interface FileStat {
  line: number;
}

interface FilePlan {
  oldPath: string;
  newPath: string;
  swap?: string;
}
