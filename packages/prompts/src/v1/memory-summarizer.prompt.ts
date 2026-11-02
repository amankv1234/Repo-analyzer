import { z } from "zod";

export const MemorySummarizerInputSchema = z.object({
  repoName: z.string(),
  existingMemorySummary: z.string().nullable().optional(),
  recentConversationTurns: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ),
});

export type MemorySummarizerInput = z.infer<typeof MemorySummarizerInputSchema>;

export const memorySummarizerPrompt = {
  id: "memory_summarizer",
  version: "1.0.0",
  targetModel: "claude-3-5-haiku",
  description: "Distills recent conversation turns into a persistent episodic memory profile for the user and repository.",
  inputSchema: MemorySummarizerInputSchema,

  render: (input: MemorySummarizerInput) => {
    const turnsText = input.recentConversationTurns
      .map((t) => `${t.role.toUpperCase()}: ${t.content}`)
      .join("\n\n");

    const existingBlock = input.existingMemorySummary
      ? `<existing_memory>\n${input.existingMemorySummary}\n</existing_memory>`
      : "<existing_memory>\n(No prior memory recorded)\n</existing_memory>";

    return `
<system_instructions>
You are an expert conversation summarizer for RepoMentor.
Your task is to update the long-term memory profile for a developer exploring repository "${input.repoName}".

Condense the existing memory and recent conversation turns into a high-density Markdown summary covering:
1. **Developer Goal & Feature Target**: What task, enhancement, or bug fix is the user working on?
2. **Current Comprehension State**: What patterns, modules, or abstractions does the user understand? Any lingering confusions?
3. **Key Files & Symbols Inspected**: Specific files and functions the user has reviewed.
4. **Developer Preferences**: Coding styles, preferred idioms, or explicit user constraints.

Keep the summary compact (under 300 words). Be factual and eliminate pleasantries.
</system_instructions>

${existingBlock}

<recent_conversation_turns>
${turnsText}
</recent_conversation_turns>
`.trim();
  },
};

