import { EmbeddingBatchResult, EmbeddingProvider } from "./provider.interface";
import { ProviderError } from "@repomentor/shared";

export interface VoyageProviderOptions {
  apiKey?: string;
  model?: string; // default: voyage-code-2
  maxBatchSize?: number; // default: 64
}

export class VoyageAIEmbeddingProvider implements EmbeddingProvider {
  public readonly providerName = "voyage";
  public readonly dimensions = 1536;
  private apiKey: string;
  private model: string;
  private maxBatchSize: number;

  constructor(options: VoyageProviderOptions = {}) {
    this.apiKey = options.apiKey || process.env.VOYAGE_API_KEY || "";
    this.model = options.model || process.env.VOYAGE_MODEL || "voyage-code-2";
    this.maxBatchSize = options.maxBatchSize || 64;
  }

  async embedText(text: string): Promise<number[]> {
    const result = await this.embedBatch([text]);
    return result.embeddings[0] || new Array(this.dimensions).fill(0);
  }

  async embedBatch(texts: string[]): Promise<EmbeddingBatchResult> {
    if (texts.length === 0) {
      return { embeddings: [], dimensions: this.dimensions, totalTokens: 0 };
    }

    if (!this.apiKey || this.apiKey.includes("placeholder") || this.apiKey.includes("dummy")) {
      // Graceful fallback to deterministic mock vectors when key is dummy in dev
      return this.generateDeterministicVectors(texts);
    }

    const allEmbeddings: number[][] = [];
    let totalTokens = 0;

    // Process in batches
    for (let i = 0; i < texts.length; i += this.maxBatchSize) {
      const batch = texts.slice(i, i + this.maxBatchSize);
      const res = await this.callVoyageApiWithRetry(batch);
      allEmbeddings.push(...res.embeddings);
      totalTokens += res.tokens;
    }

    return {
      embeddings: allEmbeddings,
      dimensions: this.dimensions,
      totalTokens,
    };
  }

  private async callVoyageApiWithRetry(
    batch: string[],
    retries = 3,
    delayMs = 1000
  ): Promise<{ embeddings: number[][]; tokens: number }> {
    try {
      const response = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: batch,
          input_type: "document",
        }),
      });

      if (!response.ok) {
        if (response.status === 429 && retries > 0) {
          await new Promise((r) => setTimeout(r, delayMs * 2));
          return this.callVoyageApiWithRetry(batch, retries - 1, delayMs * 2);
        }
        const errorText = await response.text();
        throw new Error(`Voyage API returned status ${response.status}: ${errorText}`);
      }

      const json = (await response.json()) as {
        data: { embedding: number[] }[];
        usage?: { total_tokens: number };
      };

      return {
        embeddings: json.data.map((d) => d.embedding),
        tokens: json.usage?.total_tokens || 0,
      };
    } catch (err) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
        return this.callVoyageApiWithRetry(batch, retries - 1, delayMs * 2);
      }
      throw new ProviderError("VoyageAI", String(err));
    }
  }

  private generateDeterministicVectors(texts: string[]): EmbeddingBatchResult {
    const embeddings = texts.map((t) => {
      const vec = new Array(this.dimensions).fill(0);
      let hash = 0;
      for (let i = 0; i < t.length; i++) {
        hash = (hash << 5) - hash + t.charCodeAt(i);
        hash |= 0;
      }
      for (let j = 0; j < this.dimensions; j++) {
        vec[j] = Math.sin(hash + j) * 0.1;
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

