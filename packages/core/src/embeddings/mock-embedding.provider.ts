import { EmbeddingBatchResult, EmbeddingProvider } from "./provider.interface";

export class MockEmbeddingProvider implements EmbeddingProvider {
  public readonly providerName = "mock";
  public readonly dimensions = 1536;

  async embedText(text: string): Promise<number[]> {
    const res = await this.embedBatch([text]);
    return res.embeddings[0]!;
  }

  async embedBatch(texts: string[]): Promise<EmbeddingBatchResult> {
    const embeddings = texts.map((t) => {
      const vec = new Array(this.dimensions).fill(0);
      let hash = 0;
      for (let i = 0; i < t.length; i++) {
        hash = (hash << 5) - hash + t.charCodeAt(i);
        hash |= 0;
      }
      for (let j = 0; j < this.dimensions; j++) {
        vec[j] = Math.cos(hash + j) * 0.05;
      }
      return vec;
    });

    return {
      embeddings,
      dimensions: this.dimensions,
      totalTokens: texts.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0),
    };
  }
}

