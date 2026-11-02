import { UserSummaryMemory } from "@repomentor/shared";
import { LLMProvider } from "../llm/provider.interface";
import { MessageTurn } from "../rag/query-rewriter";
import { memorySummarizerPrompt } from "@repomentor/prompts";

export interface MemorySummarizerOptions {
  llm: LLMProvider;
  repoName: string;
  existingSummary?: string | null;
  turns: MessageTurn[];
}

export class LongTermMemorySummarizer {
  constructor(private llm: LLMProvider) {}

  async summarize(options: MemorySummarizerOptions): Promise<{
    updatedSummary: string;
    profile: UserSummaryMemory;
  }> {
    const { repoName, existingSummary, turns } = options;

    if (turns.length === 0) {
      return {
        updatedSummary: existingSummary || "",
        profile: {
          goal: "",
          comprehensionState: "",
          traversedFiles: [],
          preferences: [],
        },
      };
    }

    const promptText = memorySummarizerPrompt.render({
      repoName,
      existingMemorySummary: existingSummary,
      recentConversationTurns: turns,
    });

    const summaryOutput = await this.llm.complete(promptText, {
      temperature: 0.1,
      maxTokens: 1000,
      systemPrompt:
        "You are an expert user knowledge summarizer. Condense user goals, comprehension level, traversed files, and decisions made into an episodic memory profile.",
    });

    const profile = this.parseProfile(summaryOutput);

    return {
      updatedSummary: summaryOutput.trim(),
      profile,
    };
  }

  private parseProfile(summaryMarkdown: string): UserSummaryMemory {
    const lines = summaryMarkdown.split("\n");
    let goal = "";
    let comprehension = "";
    const traversedFiles: string[] = [];
    const preferences: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes("goal:") || trimmed.toLowerCase().includes("target:")) {
        goal = trimmed.replace(/^.*?:/i, "").trim();
      } else if (trimmed.toLowerCase().includes("comprehension:") || trimmed.toLowerCase().includes("understands:")) {
        comprehension = trimmed.replace(/^.*?:/i, "").trim();
      } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const item = trimmed.replace(/^[-*]\s*/, "");
        if (item.includes(".") && (item.includes("/") || item.includes("\\"))) {
          traversedFiles.push(item);
        } else {
          preferences.push(item);
        }
      }
    }

    return {
      goal: goal || "Exploring repository architecture",
      comprehensionState: comprehension || "Building mental model of codebase",
      traversedFiles,
      preferences,
    };
  }
}

