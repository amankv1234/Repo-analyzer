import { ScoredChunk } from "../rag/retriever.interface";
import { MessageTurn } from "../rag/query-rewriter";
import { estimateTokens } from "../chunking/ast-chunker";

export interface TokenBudgetConfig {
  maxTotalBudget?: number; // default: 28,000 tokens
  systemPromptBudget?: number; // 1,500
  repoMemoryBudget?: number; // 3,000
  longTermMemoryBudget?: number; // 1,500
  retrievedCodeBudget?: number; // 12,000
  shortTermHistoryBudget?: number; // 4,000
  completionReserved?: number; // 4,000
}

export interface PromptAssemblyInput {
  systemInstructions: string;
  repoOverviewSummary: string;
  longTermMemorySummary: string | null;
  retrievedChunks: ScoredChunk[];
  shortTermHistory: MessageTurn[];
  userQuery: string;
}

export interface AssembledPromptResult {
  hydratedPrompt: string;
  estimatedTokens: number;
  trimmedHistoryTurns: number;
  includedChunksCount: number;
}

export class TokenBudgeter {
  public readonly maxTotal: number;
  private maxRetrievedCodeTokens: number;
  private maxHistoryTokens: number;

  constructor(config: TokenBudgetConfig = {}) {
    this.maxTotal = config.maxTotalBudget ?? 28_000;
    this.maxRetrievedCodeTokens = config.retrievedCodeBudget ?? 12_000;
    this.maxHistoryTokens = config.shortTermHistoryBudget ?? 4_000;
  }

  assemble(input: PromptAssemblyInput): AssembledPromptResult {
    const {
      systemInstructions,
      repoOverviewSummary,
      longTermMemorySummary,
      retrievedChunks,
      shortTermHistory,
      userQuery,
    } = input;

    // 1. Pack retrieved code chunks within retrievedCodeBudget
    let currentCodeTokens = 0;
    const selectedChunks: ScoredChunk[] = [];

    for (const chunk of retrievedChunks) {
      const chunkTokens = estimateTokens(chunk.content);
      if (currentCodeTokens + chunkTokens <= this.maxRetrievedCodeTokens) {
        selectedChunks.push(chunk);
        currentCodeTokens += chunkTokens;
      }
    }

    // 2. Pack short-term history within shortTermHistoryBudget (most recent first)
    const reversedHistory = [...shortTermHistory].reverse();
    const selectedHistory: MessageTurn[] = [];
    let currentHistoryTokens = 0;

    for (const turn of reversedHistory) {
      const turnTokens = estimateTokens(turn.content);
      if (currentHistoryTokens + turnTokens <= this.maxHistoryTokens) {
        selectedHistory.unshift(turn);
        currentHistoryTokens += turnTokens;
      }
    }

    const trimmedHistoryTurns = shortTermHistory.length - selectedHistory.length;

    // 3. Assemble structured XML blocks
    const chunksXml = selectedChunks
      .map(
        (c) => `<code_chunk id="${c.id}" file="${c.filePath}" lines="${c.startLine}-${c.endLine}" symbol="${c.symbolName ?? "anonymous"}">
<![CDATA[
${c.content}
]]>
</code_chunk>`
      )
      .join("\n\n");

    const historyText = selectedHistory
      .map((h) => `${h.role.toUpperCase()}: ${h.content}`)
      .join("\n\n");

    const memoryBlock = longTermMemorySummary
      ? `<user_memory>\n${longTermMemorySummary}\n</user_memory>`
      : "";

    const hydratedPrompt = `
<system_instructions>
${systemInstructions}
</system_instructions>

<repository_overview>
${repoOverviewSummary}
</repository_overview>

${memoryBlock}

<retrieved_code_chunks>
${chunksXml}
</retrieved_code_chunks>

<conversation_history>
${historyText}
</conversation_history>

<user_query>
${userQuery}
</user_query>
`.trim();

    return {
      hydratedPrompt,
      estimatedTokens: estimateTokens(hydratedPrompt),
      trimmedHistoryTurns,
      includedChunksCount: selectedChunks.length,
    };
  }
}

