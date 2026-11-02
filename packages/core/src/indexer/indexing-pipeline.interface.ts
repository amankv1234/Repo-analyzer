import { JobStep, RepoOverviewSections } from "@repomentor/shared";

export interface IndexingStepUpdate {
  step: JobStep;
  progressPercent: number;
  message?: string;
}

export interface IndexingPipelineOptions {
  repoId: string;
  repoUrl: string;
  branch?: string;
  onProgress?: (update: IndexingStepUpdate) => Promise<void> | void;
}

export interface IndexingResult {
  repoId: string;
  headCommit: string;
  filesIndexedCount: number;
  chunksIndexedCount: number;
  overview: RepoOverviewSections;
}

export interface IndexingPipeline {
  execute(options: IndexingPipelineOptions): Promise<IndexingResult>;
}

