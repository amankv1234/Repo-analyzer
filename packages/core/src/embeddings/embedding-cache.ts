import { createHash } from "crypto";

export function computeContentHash(content: string): string {
  return createHash("sha256").update(content.trim()).digest("hex");
}

export class EmbeddingContentCache {
  private cache = new Map<string, number[]>();

  get(hash: string): number[] | undefined {
    return this.cache.get(hash);
  }

  set(hash: string, vector: number[]): void {
    this.cache.set(hash, vector);
  }

  has(hash: string): boolean {
    return this.cache.has(hash);
  }

  size(): number {
    return this.cache.size;
  }
}

