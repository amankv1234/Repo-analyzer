# LLM Prompt Catalog & Governance - RepoMentor

---

## 1. Prompt Architecture & Governance Rules

RepoMentor enforces a strict prompt engineering policy:
1. **Zero Inline Prompts**: No raw prompt strings are permitted inside application controllers, services, or worker files.
2. **Versioned Artifacts**: All prompts are authored as TypeScript modules inside `packages/prompts/src/v<number>/`.
3. **Type-Safe Inputs & Outputs**: Every prompt defines a Zod input schema for parameter hydration and a Zod output schema for structured response validation.
4. **SemVer Evolution**:
   - Patch (`1.0.1`): Minor wording tweaks, typo fixes, or formatting changes that do not alter the expected output schema.
   - Minor (`1.1.0`): Additional optional context variables added to the template.
   - Major (`2.0.0`): Structural changes, model family changes, or breaking schema modifications.

---

## 2. Master Catalog of Prompts

### 2.1 `repo-overview-generator` (v1.0.0)
- **Path**: `packages/prompts/src/v1/repo-overview.prompt.ts`
- **Target Model**: Claude 3.5 Sonnet
- **Purpose**: Generates the 7-section Contributor Onboarding Report during repository indexing.
- **Inputs**:
  - `repoName`: string
  - `repoOwner`: string
  - `languages`: Record<string, number>
  - `fileTree`: string
  - `rootManifests`: { path: string; content: string }[] (e.g., `package.json`, `Cargo.toml`, `go.mod`, `README.md`)
  - `keySourceChunks`: { file: string; content: string }[]
- **Outputs (JSON Schema)**:
  - `summary`: string (1 paragraph)
  - `purpose`: string (why it exists)
  - `tech_stack`: { name: string; category: string; justification: string }[]
  - `architecture`: { description: string; mermaidDiagram: string }
  - `folder_structure`: { path: string; description: string }[]
  - `setup_guide`: { prerequisites: string[]; steps: string[]; troubleshooting: string[] }
  - `key_files`: { path: string; reason: string; readOrder: number }[]
  - `contribution_workflow`: { branchNaming: string; prProcess: string; commitFormat: string }

### 2.2 `rag-code-chat` (v1.0.0)
- **Path**: `packages/prompts/src/v1/rag-qa.prompt.ts`
- **Target Model**: Claude 3.5 Sonnet
- **Purpose**: Answers user technical queries with verifiable source citations and contextual code references.
- **Inputs**:
  - `repoOverview`: string
  - `userMemorySummary`: string | null
  - `codeChunks`: { id: string; file: string; startLine: number; endLine: number; content: string }[]
  - `conversationHistory`: { role: 'user' | 'assistant'; content: string }[]
  - `userQuery`: string
- **Outputs**:
  - Streamed Markdown text containing bracketed line citations `[filepath:start_line-end_line]`.

### 2.3 `memory-summarizer` (v1.0.0)
- **Path**: `packages/prompts/src/v1/memory-summarizer.prompt.ts`
- **Target Model**: Claude 3.5 Haiku
- **Purpose**: Periodically condenses recent conversation turns into a persistent episodic memory profile.
- **Inputs**:
  - `existingMemory`: string | null
  - `recentTurns`: { role: 'user' | 'assistant'; content: string }[]
  - `repoName`: string
- **Outputs (Markdown)**:
  - Formatted bulleted markdown summarizing:
    1. Current Feature Goal & Task
    2. User Comprehension State & Assumptions
    3. Traversed Files & Inspected Components
    4. Expressed Developer Preferences

### 2.4 `ast-chunk-summarizer` (v1.0.0)
- **Path**: `packages/prompts/src/v1/chunk-summary.prompt.ts`
- **Target Model**: Claude 3.5 Haiku
- **Purpose**: Generates high-density 1-2 sentence semantic summaries of large complex functions or classes for embedding alongside raw code.
- **Inputs**:
  - `filePath`: string
  - `symbolName`: string
  - `symbolType`: string
  - `sourceCode`: string
- **Outputs**:
  - Compact natural language description of symbol inputs, outputs, side-effects, and role.

### 2.5 `enhancement-assistant` (v1.0.0) — Inline
- **Location**: `packages/core/src/enhancement/enhancement-assistant.ts` (inlined pending extraction to `packages/prompts/src/v2/`)
- **Target Model**: Claude 3.5 Sonnet
- **Purpose**: Produces a grounded, step-by-step enhancement plan with impact analysis, test strategy, and unified diffs for "add feature X" or "fix bug Y" requests.
- **Inputs**:
  - `repoName`: string
  - `userRequest`: string
  - `relevantChunks`: ScoredChunk[] (existing code snippets retrieved via hybrid search)
- **Outputs (JSON Schema)**:
  - `featureOrBug`, `summary`, `targetFiles[]`, `impactAnalysis`, `stepByStepPlan[]`, `testPlan[]`, `suggestedDiffs[]`

### 2.6 `folder-summarizer` (v1.0.0) — Inline
- **Location**: `packages/core/src/overview/overview-generator.ts` (map-reduce step)
- **Target Model**: Claude 3.5 Sonnet
- **Purpose**: Summarizes individual folder contents during the map phase of overview generation.
- **Inputs**:
  - Folder path + file listing
- **Outputs**:
  - 2-3 sentence summary of folder's architectural role

> [!NOTE]
> Prompts 2.5 and 2.6 are currently inlined in core modules. They should be extracted into `packages/prompts/src/v2/` as part of Part 3 cleanup (see ADR-0004 provider abstraction).

