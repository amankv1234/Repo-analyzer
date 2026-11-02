import { LLMProvider } from "../llm/provider.interface";

export interface MessageTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Rewrites a conversational follow-up question (e.g. "where is that function called?")
 * into an unambiguous standalone search query using chat history.
 */
export async function rewriteQueryToStandalone(
  llm: LLMProvider,
  history: MessageTurn[],
  userQuery: string
): Promise<string> {
  // If there is no chat history, the question is already standalone
  if (!history || history.length === 0) {
    return userQuery;
  }

  // If question is already long and self-contained, skip LLM rewrite to save latency
  if (userQuery.length > 80 && !/\b(it|that|this|there|them|those)\b/i.test(userQuery)) {
    return userQuery;
  }

  const recentHistory = history
    .slice(-4)
    .map((h) => `${h.role.toUpperCase()}: ${h.content}`)
    .join("\n");

  const prompt = `
<instructions>
Given the recent conversation history and a follow-up question from the user, rewrite the follow-up question into a single standalone search query for a code repository.
The search query must be self-contained and replace pronouns (like "it", "that", "this function") with the specific symbols, file names, or concepts mentioned in prior turns.
Return ONLY the standalone search query without quotes or preamble.
</instructions>

<conversation_history>
${recentHistory}
</conversation_history>

<follow_up_question>
${userQuery}
</follow_up_question>
`.trim();

  try {
    const rewritten = await llm.complete(prompt, {
      temperature: 0.0,
      maxTokens: 100,
    });
    return rewritten.trim().replace(/^["']|["']$/g, "") || userQuery;
  } catch {
    return userQuery;
  }
}

