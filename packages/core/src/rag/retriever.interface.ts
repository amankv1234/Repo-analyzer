import { CodeCitation } from "@repomentor/shared";

export interface ScoredChunk {
  id: string;
  repoId: string;
  fileId: string;
  filePath: string;
  startLine: number;
  endLine: number;
  symbolName: string | null;
  symbolType: string | null;
  content: string;
  score: number;
}

export interface HybridRetrievalOptions {
  repoId: string;
  limit?: number;
  vectorWeight?: number;
  fulltextWeight?: number;
  rrfK?: number;
}

export interface RetrievalResult {
  chunks: ScoredChunk[];
  citations: CodeCitation[];
}

/**
 * Merges ranked dense vector results and sparse lexical results using Reciprocal Rank Fusion (RRF).
 * Formula: RRF_Score(d) = sum(1 / (k + rank_i))
 */
export function mergeRRF(
  denseRanked: { id: string; rank: number }[],
  sparseRanked: { id: string; rank: number }[],
  k: number = 60
): { id: string; rrfScore: number }[] {
  const scores = new Map<string, number>();

  for (const item of denseRanked) {
    const current = scores.get(item.id) ?? 0;
    scores.set(item.id, current + 1 / (k + item.rank));
  }

  for (const item of sparseRanked) {
    const current = scores.get(item.id) ?? 0;
    scores.set(item.id, current + 1 / (k + item.rank));
  }

  return Array.from(scores.entries())
    .map(([id, rrfScore]) => ({ id, rrfScore }))
    .sort((a, b) => b.rrfScore - a.rrfScore);
}

export interface HybridRetriever {
  retrieve(query: string, options: HybridRetrievalOptions): Promise<RetrievalResult>;
}

