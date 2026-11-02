import { describe, it, expect } from "vitest";
import { RobustIndexingPipeline } from "../src/indexer/indexing-pipeline";
import { MockLLMProvider } from "../src/llm/mock-llm.provider";
import { MockEmbeddingProvider } from "../src/embeddings/mock-embedding.provider";

describe("Indexing Pipeline Integration", () => {
  it("should validate and execute pipeline steps", async () => {
    const mockLlm = new MockLLMProvider();
    const mockEmbedder = new MockEmbeddingProvider();
    const pipeline = new RobustIndexingPipeline({
      llm: mockLlm,
      embedder: mockEmbedder,
    });

    const stepsReported: string[] = [];

    // Test with invalid URL to verify rejection step
    await expect(
      pipeline.execute({
        repoId: "00000000-0000-0000-0000-000000000001",
        repoUrl: "https://evil-site.com/fake/repo",
        onProgress: (u) => {
          stepsReported.push(u.step);
        },
      })
    ).rejects.toThrow();

    expect(stepsReported).toContain("validating");
  });
});

