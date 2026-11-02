import { CodeCitation } from "@repomentor/shared";
import {
  HybridRetriever,
  HybridRetrievalOptions,
  RetrievalResult,
  ScoredChunk,
  mergeRRF,
} from "./retriever.interface";
import { EmbeddingProvider } from "../embeddings/provider.interface";

export interface DatabaseChunkProvider {
  searchVector(
    repoId: string,
    queryEmbedding: number[],
    limit: number
  ): Promise<{ id: string; rank: number; chunk: ScoredChunk }[]>;

  searchFullText(
    repoId: string,
    queryText: string,
    limit: number
  ): Promise<{ id: string; rank: number; chunk: ScoredChunk }[]>;
}

export class CodeHybridRetriever implements HybridRetriever {
  constructor(
    private embeddingProvider: EmbeddingProvider,
    private dbProvider: DatabaseChunkProvider
  ) {}

  async retrieve(query: string, options: HybridRetrievalOptions): Promise<RetrievalResult> {
    const limit = options.limit ?? 8;
    const rrfK = options.rrfK ?? 60;
    const candidateLimit = limit * 3;

    // 1. Generate query embedding
    const queryEmbedding = await this.embeddingProvider.embedText(query);

    // 2. Fetch candidates from both channels in parallel
    const [denseCandidates, sparseCandidates] = await Promise.all([
      this.dbProvider.searchVector(options.repoId, queryEmbedding, candidateLimit),
      this.dbProvider.searchFullText(options.repoId, query, candidateLimit),
    ]);

    // Build chunk lookup map
    const chunkMap = new Map<string, ScoredChunk>();
    for (const c of denseCandidates) chunkMap.set(c.id, c.chunk);
    for (const c of sparseCandidates) chunkMap.set(c.id, c.chunk);

    // 3. Merge ranks using Reciprocal Rank Fusion
    const denseRanked = denseCandidates.map((c) => ({ id: c.id, rank: c.rank }));
    const sparseRanked = sparseCandidates.map((c) => ({ id: c.id, rank: c.rank }));

    const rrfMerged = mergeRRF(denseRanked, sparseRanked, rrfK);
    const topRanked = rrfMerged.slice(0, limit);

    const scoredChunks: ScoredChunk[] = [];
    const citations: CodeCitation[] = [];

    for (const item of topRanked) {
      const chunk = chunkMap.get(item.id);
      if (chunk) {
        chunk.score = item.rrfScore;
        scoredChunks.push(chunk);
        citations.push({
          filePath: chunk.filePath,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          symbolName: chunk.symbolName,
        });
      }
    }

    return {
      chunks: scoredChunks,
      citations,
    };
  }
}

