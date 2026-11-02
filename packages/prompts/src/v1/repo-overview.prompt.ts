import { z } from "zod";
import { RepoOverviewSectionsSchema } from "@repomentor/shared";

export const RepoOverviewInputSchema = z.object({
  repoName: z.string(),
  repoOwner: z.string(),
  languages: z.record(z.number()),
  fileTree: z.string(),
  rootManifests: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
    })
  ),
  keySourceSnippets: z.array(
    z.object({
      filePath: z.string(),
      content: z.string(),
    })
  ),
});

export type RepoOverviewInput = z.infer<typeof RepoOverviewInputSchema>;

export const repoOverviewPrompt = {
  id: "repo_overview_generation",
  version: "1.0.0",
  targetModel: "claude-3-5-sonnet",
  description: "Synthesizes the complete 7-section contributor onboarding guide from AST and repository manifests.",
  inputSchema: RepoOverviewInputSchema,
  outputSchema: RepoOverviewSectionsSchema,

  render: (input: RepoOverviewInput) => {
    const manifestsXml = input.rootManifests
      .map(
        (m) => `<manifest path="${m.path}">
<![CDATA[
${m.content}
]]>
</manifest>`
      )
      .join("\n\n");

    const snippetsXml = input.keySourceSnippets
      .map(
        (s) => `<code_sample path="${s.filePath}">
<![CDATA[
${s.content}
]]>
</code_sample>`
      )
      .join("\n\n");

    return `
<system_instructions>
You are RepoMentor, a principal software architect and onboarding mentor.
Your task is to analyze the provided repository metadata, dependency manifests, folder tree, and entry point code samples to synthesize an exhaustive, high-signal Contributor Onboarding Report.

The report MUST contain exactly these 7 sections formatted as valid JSON adhering to the target schema:
1. "summary": A concise executive summary of what this project is.
2. "purpose": Why the project exists, core problems it solves, and target users.
3. "techStack": Array of { name, category, justification } explaining the runtime, frameworks, databases, and build tools.
4. "architecture": { description, mermaidDiagram } describing high-level module relationships and data flows with valid Mermaid diagram syntax.
5. "folderStructure": Array of { path, description } highlighting high-level modules and their architectural responsibilities.
6. "setupGuide": { prerequisites: [], steps: [], troubleshooting: [] } detailing exact local prerequisites and dev commands.
7. "keyFiles": Array of { path, reason, readOrder } ordering the top files a newcomer must read first to understand the control flow.
8. "contributionWorkflow": { branchNaming, prProcess, commitFormat } detailing git branch conventions, testing, and PR expectations.

CRITICAL INSTRUCTIONS:
- You must strictly output RAW JSON matching the schema. Do not enclose in markdown ticks \`\`\`json or add conversational text.
- Ground all facts strictly in the provided files. Never speculate or hallucinate non-existent tools.
</system_instructions>

<repository_metadata owner="${input.repoOwner}" name="${input.repoName}">
Languages: ${JSON.stringify(input.languages)}
</repository_metadata>

<file_tree>
${input.fileTree}
</file_tree>

<dependency_manifests>
${manifestsXml}
</dependency_manifests>

<sample_code>
${snippetsXml}
</sample_code>
`.trim();
  },
};

