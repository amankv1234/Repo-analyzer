import { z } from "zod";

export const ChunkSummaryInputSchema = z.object({
  filePath: z.string(),
  symbolName: z.string().nullable().optional(),
  symbolType: z.string().nullable().optional(),
  codeContent: z.string(),
});

export type ChunkSummaryInput = z.infer<typeof ChunkSummaryInputSchema>;

export const chunkSummaryPrompt = {
  id: "chunk_summary",
  version: "1.0.0",
  targetModel: "claude-3-5-haiku",
  description: "Produces a dense 1-2 sentence semantic summary of an AST code symbol for vector embedding enrichment.",
  inputSchema: ChunkSummaryInputSchema,

  render: (input: ChunkSummaryInput) => `
<instructions>
You are an expert static code summarizer.
Summarize the purpose, inputs, outputs, and side-effects of this code unit in 1 to 2 clear sentences.
Focus on WHAT it accomplishes and WHY it exists in the architecture.
Do not repeat syntax verbatim.
</instructions>

<code_unit file="${input.filePath}" symbol="${input.symbolName ?? "anonymous"}" type="${input.symbolType ?? "unknown"}">
<![CDATA[
${input.codeContent}
]]>
</code_unit>
`.trim(),
};

