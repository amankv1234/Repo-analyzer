import { RepoFacts, RepoOverviewSections, RepoOverviewSectionsSchema, ValidationError } from "@repomentor/shared";
import { LLMProvider } from "../llm/provider.interface";
import { repoOverviewPrompt } from "@repomentor/prompts";

export interface OverviewGeneratorOptions {
  llm: LLMProvider;
  owner: string;
  repo: string;
  facts: RepoFacts;
  keySnippets: { filePath: string; content: string }[];
}

export class OverviewGenerator {
  constructor(private llm: LLMProvider) {}

  /**
   * Generates the comprehensive 7-section Contributor Onboarding Report with Zod validation.
   */
  async generateOverview(options: Omit<OverviewGeneratorOptions, "llm">): Promise<RepoOverviewSections> {
    const { owner, repo, facts, keySnippets } = options;

    // Build file tree representation
    const fileTreeSummary = facts.fileTree.folders
      .map((f) => `- ${f.path} (${f.fileCount} files)`)
      .join("\n");

    // Gather root manifests
    const rootManifests = facts.dependencies.map((d) => ({
      path: d.manifestFile,
      content: JSON.stringify(d.items.slice(0, 50), null, 2),
    }));

    // If large repo (> 100 files), do map-step on top folders
    let folderInsights = "";
    if (facts.fileTree.totalFiles > 100 && facts.fileTree.folders.length > 3) {
      folderInsights = await this.summarizeMajorFolders(facts.fileTree.folders.slice(0, 5));
    }

    // Hydrate versioned prompt template
    const languagesRecord: Record<string, number> = {};
    facts.languages.forEach((l) => {
      languagesRecord[l.language] = l.linesOfCode;
    });

    const renderedPrompt = repoOverviewPrompt.render({
      repoOwner: owner,
      repoName: repo,
      languages: languagesRecord,
      fileTree: fileTreeSummary + (folderInsights ? `\n\nFolder Summaries:\n${folderInsights}` : ""),
      rootManifests,
      keySourceSnippets: keySnippets.map((s) => ({
        filePath: s.filePath,
        content: s.content.slice(0, 2000), // Protect context limits
      })),
    });

    // Invoke LLM
    const responseText = await this.llm.complete(renderedPrompt, {
      temperature: 0.1,
      maxTokens: 4000,
      systemPrompt:
        "You are an expert technical architect. You MUST return strictly valid JSON matching the requested schema. Never output markdown code fences or commentary.",
    });

    // Parse and validate with Zod
    return this.parseAndValidateOverview(responseText);
  }

  private async summarizeMajorFolders(
    folders: { path: string; fileCount: number }[]
  ): Promise<string> {
    const summaries: string[] = [];
    for (const folder of folders) {
      if (folder.path === "root") continue;
      summaries.push(`- **${folder.path}**: Core module containing ${folder.fileCount} source files.`);
    }
    return summaries.join("\n");
  }

  private parseAndValidateOverview(rawOutput: string): RepoOverviewSections {
    let cleanJson = rawOutput.trim();

    // Remove markdown code fences if model returned ```json ... ```
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      // Attempt to extract JSON block
      const start = cleanJson.indexOf("{");
      const end = cleanJson.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        parsed = JSON.parse(cleanJson.substring(start, end + 1));
      } else {
        throw new ValidationError("LLM failed to produce valid JSON for repository overview");
      }
    }

    const validated = RepoOverviewSectionsSchema.safeParse(parsed);
    if (!validated.success) {
      throw new ValidationError(
        `LLM overview validation failed: ${validated.error.issues.map((i) => i.message).join(", ")}`
      );
    }

    return validated.data;
  }
}

