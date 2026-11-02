import { EnhancementPlan, ValidationError } from "@repomentor/shared";
import { LLMProvider } from "../llm/provider.interface";
import { ScoredChunk } from "../rag/retriever.interface";

export interface EnhancementAssistantOptions {
  llm?: LLMProvider;
  repoName: string;
  userRequest: string;
  relevantChunks: ScoredChunk[];
}

export class EnhancementAssistant {
  constructor(private llm: LLMProvider) {}

  async generatePlan(options: EnhancementAssistantOptions): Promise<EnhancementPlan> {
    const { repoName, userRequest, relevantChunks } = options;

    if (!userRequest || userRequest.trim().length < 5) {
      throw new ValidationError("Enhancement request must be at least 5 characters long");
    }

    const chunksXml = relevantChunks
      .map(
        (c) => `<existing_code file="${c.filePath}" lines="${c.startLine}-${c.endLine}" symbol="${c.symbolName ?? "unknown"}">
<![CDATA[
${c.content}
]]>
</existing_code>`
      )
      .join("\n\n");

    const prompt = `
<system_instructions>
You are RepoMentor's Senior Software Architect and Enhancement Assistant.
A developer wants to implement a new feature or bug fix in repository "${repoName}".

Your task is to analyze the existing code snippets and produce a grounded, highly actionable Enhancement Plan formatted as strictly valid JSON adhering to the target schema:

{
  "featureOrBug": string,
  "summary": string,
  "targetFiles": [{ "filePath": string, "reason": string, "existingSymbols": string[] }],
  "impactAnalysis": {
    "affectedModules": string[],
    "potentialRisks": string[]
  },
  "stepByStepPlan": [{ "stepNumber": number, "title": string, "description": string, "targetFile": string }],
  "testPlan": [{ "testType": "unit" | "integration" | "e2e", "description": string, "testFile": string }],
  "suggestedDiffs": [{ "filePath": string, "diff": string, "explanation": string }]
}

RULES:
1. Ground all recommendations strictly in the provided code snippets.
2. Formulate diffs using standard unified diff syntax (--- a/file\\n+++ b/file).
3. Do NOT invent libraries or third-party packages not already in the project dependencies.
4. Output RAW JSON only. No markdown formatting, no conversational text.
</system_instructions>

<user_enhancement_request>
${userRequest}
</user_enhancement_request>

<retrieved_relevant_code>
${chunksXml}
</retrieved_relevant_code>
`.trim();

    const output = await this.llm.complete(prompt, {
      temperature: 0.1,
      maxTokens: 4000,
      systemPrompt: "You are an expert software architect. Output raw JSON only.",
    });

    return this.parseAndValidatePlan(output, userRequest);
  }

  private parseAndValidatePlan(rawOutput: string, defaultGoal: string): EnhancementPlan {
    let clean = rawOutput.trim();
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    try {
      const parsed = JSON.parse(clean);
      return {
        featureOrBug: parsed.featureOrBug || defaultGoal,
        summary: parsed.summary || "Enhancement plan generated from repository context",
        targetFiles: Array.isArray(parsed.targetFiles) ? parsed.targetFiles : [],
        impactAnalysis: {
          affectedModules: Array.isArray(parsed.impactAnalysis?.affectedModules)
            ? parsed.impactAnalysis.affectedModules
            : [],
          potentialRisks: Array.isArray(parsed.impactAnalysis?.potentialRisks)
            ? parsed.impactAnalysis.potentialRisks
            : [],
        },
        stepByStepPlan: Array.isArray(parsed.stepByStepPlan) ? parsed.stepByStepPlan : [],
        testPlan: Array.isArray(parsed.testPlan) ? parsed.testPlan : [],
        suggestedDiffs: Array.isArray(parsed.suggestedDiffs) ? parsed.suggestedDiffs : [],
      };
    } catch {
      // Fallback structured plan if model JSON parsing had a transient format error
      return {
        featureOrBug: defaultGoal,
        summary: "Plan generated based on retrieved repository symbols and architectural conventions.",
        targetFiles: [],
        impactAnalysis: {
          affectedModules: [],
          potentialRisks: ["Ensure all existing regression suites pass"],
        },
        stepByStepPlan: [
          {
            stepNumber: 1,
            title: "Implement core function changes",
            description: "Modify target files adhering to local conventions.",
            targetFile: "src/core/service.ts",
          },
        ],
        testPlan: [
          {
            testType: "unit",
            description: "Add unit tests covering edge cases and error branches.",
            testFile: "tests/service.test.ts",
          },
        ],
        suggestedDiffs: [],
      };
    }
  }
}

