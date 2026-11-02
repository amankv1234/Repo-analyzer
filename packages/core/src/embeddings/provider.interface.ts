export interface EmbeddingBatchResult {
  embeddings: number[][];
  dimensions: number;
  totalTokens: number;
}

export interface EmbeddingProvider {
  readonly providerName: string;
  readonly dimensions: number;

  embedText(text: string): Promise<number[]>;

  embedBatch(texts: string[]): Promise<EmbeddingBatchResult>;
}

