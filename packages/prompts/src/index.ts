export * from "./v1/repo-overview.prompt";
export * from "./v1/rag-qa.prompt";
export * from "./v1/memory-summarizer.prompt";
export * from "./v1/chunk-summary.prompt";

import { repoOverviewPrompt } from "./v1/repo-overview.prompt";
import { ragQaPrompt } from "./v1/rag-qa.prompt";
import { memorySummarizerPrompt } from "./v1/memory-summarizer.prompt";
import { chunkSummaryPrompt } from "./v1/chunk-summary.prompt";

export const promptCatalog = {
  [repoOverviewPrompt.id]: repoOverviewPrompt,
  [ragQaPrompt.id]: ragQaPrompt,
  [memorySummarizerPrompt.id]: memorySummarizerPrompt,
  [chunkSummaryPrompt.id]: chunkSummaryPrompt,
} as const;

export type PromptCatalog = typeof promptCatalog;

