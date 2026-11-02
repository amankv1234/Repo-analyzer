import { describe, it, expect } from "vitest";
import { LongTermMemorySummarizer } from "../src/memory/memory-summarizer";
import { MockLLMProvider } from "../src/llm/mock-llm.provider";

describe("Memory: Long-Term Memory Summarizer", () => {
  it("should summarize conversation turns into an episodic profile", async () => {
    const mockLlm = new MockLLMProvider();
    const summarizer = new LongTermMemorySummarizer(mockLlm);

    const turns = [
      { role: "user" as const, content: "I want to implement OAuth2 PKCE flow." },
      { role: "assistant" as const, content: "Sure, let's inspect src/auth/pkce.ts." },
    ];

    const result = await summarizer.summarize({
      llm: mockLlm,
      repoName: "my-auth-service",
      turns,
    });

    expect(result.updatedSummary).toContain("Active Goal");
    expect(result.profile).toBeDefined();
    expect(result.profile.traversedFiles).toContain("packages/core/src/rag/retriever.interface.ts");
  });

  it("should handle empty turns list gracefully", async () => {
    const mockLlm = new MockLLMProvider();
    const summarizer = new LongTermMemorySummarizer(mockLlm);

    const result = await summarizer.summarize({
      llm: mockLlm,
      repoName: "test-repo",
      existingSummary: "Existing user goal",
      turns: [],
    });

    expect(result.updatedSummary).toBe("Existing user goal");
    expect(result.profile.goal).toBe("");
  });
});

