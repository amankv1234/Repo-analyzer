import { describe, it, expect } from "vitest";
import { TokenBudgeter } from "../src/memory/token-budgeter";
import { ScoredChunk } from "../src/rag/retriever.interface";

describe("Memory: Token Budgeter & Trimming Priority", () => {
  it("should assemble a complete XML prompt within token budgets", () => {
    const budgeter = new TokenBudgeter({
      maxTotalBudget: 10000,
      retrievedCodeBudget: 4000,
      shortTermHistoryBudget: 2000,
    });

    const chunks: ScoredChunk[] = [
      {
        id: "chunk-1",
        repoId: "repo-1",
        fileId: "file-1",
        filePath: "src/index.ts",
        startLine: 1,
        endLine: 20,
        symbolName: "main",
        symbolType: "function",
        content: "export function main() { console.log('hello'); }",
        score: 0.95,
      },
    ];

    const result = budgeter.assemble({
      systemInstructions: "You are RepoMentor.",
      repoOverviewSummary: "A TypeScript web application.",
      longTermMemorySummary: "User is building auth.",
      retrievedChunks: chunks,
      shortTermHistory: [
        { role: "user", content: "What does main do?" },
        { role: "assistant", content: "It starts the server." },
      ],
      userQuery: "How does error handling work?",
    });

    expect(result.hydratedPrompt).toContain("<system_instructions>");
    expect(result.hydratedPrompt).toContain("<retrieved_code_chunks>");
    expect(result.hydratedPrompt).toContain("<user_memory>");
    expect(result.includedChunksCount).toBe(1);
    expect(result.trimmedHistoryTurns).toBe(0);
    expect(result.estimatedTokens).toBeGreaterThan(50);
  });

  it("should trim oldest conversation turns when history exceeds budget", () => {
    const budgeter = new TokenBudgeter({
      maxTotalBudget: 5000,
      shortTermHistoryBudget: 15, // small budget to force trimming older turns
    });

    const history = [
      { role: "user" as const, content: "This is a very long early turn from the beginning of the chat that should be trimmed." },
      { role: "assistant" as const, content: "This is an old response from turn 2 that should also be trimmed out." },
      { role: "user" as const, content: "Recent turn 1." },
      { role: "assistant" as const, content: "Recent turn 2." },
    ];

    const result = budgeter.assemble({
      systemInstructions: "Instructions",
      repoOverviewSummary: "Overview",
      longTermMemorySummary: null,
      retrievedChunks: [],
      shortTermHistory: history,
      userQuery: "New question",
    });

    expect(result.trimmedHistoryTurns).toBeGreaterThan(0);
    expect(result.hydratedPrompt).toContain("Recent turn 2.");
  });
});
