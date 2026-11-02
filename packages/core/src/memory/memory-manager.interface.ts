import { UserSummaryMemory } from "@repomentor/shared";

export interface MemoryContext {
  userId?: string | null;
  repoId: string;
  shortTermTurns: { role: "user" | "assistant"; content: string }[];
  repoOverviewSummary: string;
  longTermMemorySummary: string | null;
}

export interface MemorySummaryResult {
  updatedSummary: string;
  parsedProfile: UserSummaryMemory;
  compressedTurnsCount: number;
}

export interface MemoryManager {
  assembleContext(userId: string | null | undefined, repoId: string): Promise<MemoryContext>;

  triggerPeriodicSummary(
    userId: string,
    repoId: string,
    conversationId: string
  ): Promise<MemorySummaryResult>;
}

