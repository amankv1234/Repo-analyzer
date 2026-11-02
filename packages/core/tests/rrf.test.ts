import { describe, it, expect } from "vitest";
import { mergeRRF } from "../src/rag/retriever.interface";

describe("mergeRRF (Reciprocal Rank Fusion)", () => {
  it("should combine ranks and prioritize documents present in both dense and sparse results", () => {
    const dense = [
      { id: "chunk-A", rank: 1 },
      { id: "chunk-B", rank: 2 },
      { id: "chunk-C", rank: 3 },
    ];

    const sparse = [
      { id: "chunk-B", rank: 1 },
      { id: "chunk-D", rank: 2 },
      { id: "chunk-A", rank: 3 },
    ];

    const merged = mergeRRF(dense, sparse, 60);

    // Both chunk-B and chunk-A appear in both lists:
    // chunk-B: 1/(60+2) + 1/(60+1) = 1/62 + 1/61 = 0.016129 + 0.016393 = 0.032522
    // chunk-A: 1/(60+1) + 1/(60+3) = 1/61 + 1/63 = 0.016393 + 0.015873 = 0.032266
    // chunk-B score is slightly higher than chunk-A
    expect(merged[0]?.id).toBe("chunk-B");
    expect(merged[1]?.id).toBe("chunk-A");
    expect(merged.length).toBe(4);
  });

  it("should handle empty candidate lists gracefully", () => {
    const merged = mergeRRF([], [], 60);
    expect(merged).toEqual([]);
  });

  it("should return correct ordering when one list is empty", () => {
    const dense = [
      { id: "chunk-1", rank: 1 },
      { id: "chunk-2", rank: 2 },
    ];
    const merged = mergeRRF(dense, [], 60);

    expect(merged).toHaveLength(2);
    expect(merged[0]?.id).toBe("chunk-1");
    expect(merged[1]?.id).toBe("chunk-2");
  });
});

