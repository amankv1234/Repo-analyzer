# Workflow: Add or Update an LLM Prompt

Follow these numbered steps sequentially when introducing a new prompt or modifying an existing one.

---

## Step 1: Create or Version the Prompt File in `packages/prompts`
1. Prompts are versioned by directory. If updating an existing prompt with breaking changes, create the next version (e.g., `packages/prompts/src/v2/`).
2. Create a prompt template file (e.g., `packages/prompts/src/v1/dependency-analyzer.prompt.ts`).
3. Define the template structure implementing the `PromptDefinition` contract:
   ```typescript
   import { z } from "zod";

   export const DependencyAnalyzerInputSchema = z.object({
     packageJsonContent: z.string(),
     primaryLanguage: z.string(),
   });

   export type DependencyAnalyzerInput = z.infer<typeof DependencyAnalyzerInputSchema>;

   export const dependencyAnalyzerPrompt = {
     id: "dependency_analyzer",
     version: "1.0.0",
     targetModel: "claude-3-5-haiku",
     description: "Analyzes root dependency manifests to classify frameworks and libraries",
     inputSchema: DependencyAnalyzerInputSchema,
     render: (input: DependencyAnalyzerInput) => `
<instructions>
You are an expert software dependency analyzer.
Classify each library into core framework, database, testing, utility, or build tool.
</instructions>
<manifest language="${input.primaryLanguage}">
${input.packageJsonContent}
</manifest>
`,
   };
   ```

---

## Step 2: Register in Prompt Catalog
1. Open `packages/prompts/src/index.ts`.
2. Export the prompt and register it in the central registry dictionary.
3. Update `docs/PROMPTS.md` with the new prompt ID, inputs, outputs, and version details.

---

## Step 3: Write Unit Tests for Template Rendering
1. Create `packages/prompts/tests/dependency-analyzer.test.ts`.
2. Test input validation (ensure missing fields throw Zod errors).
3. Test output string formatting and verify XML boundary tags.

---

## Step 4: Consume Prompt in Domain Services
1. In `packages/core/src/llm/`, import the prompt definition from `@repomentor/prompts`.
2. Call `prompt.render(input)` and pass the hydrated string to `LLMProvider.complete()`.
3. Validate the LLM output against the expected response schema.

