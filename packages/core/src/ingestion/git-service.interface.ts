export interface ClonedRepo {
  localPath: string;
  headCommitHash: string;
  defaultBranch: string;
  totalSize: number;
  detectedLanguages: Record<string, number>;
  filePaths: string[];
}

export interface RepoFilterOptions {
  maxFileSizeKb: number;
  maxTotalSizeMb: number;
  ignoredPatterns: string[];
  allowedExtensions: string[];
}

export interface GitService {
  validateRepoUrl(url: string): { isValid: boolean; owner: string; name: string };

  cloneShallow(url: string, targetDir: string, branch?: string): Promise<ClonedRepo>;

  cleanup(targetDir: string): Promise<void>;
}

