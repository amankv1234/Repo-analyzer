import { LLMCompletionOptions, LLMProvider } from "./provider.interface";

export class MockLLMProvider implements LLMProvider {
  public readonly providerName = "mock";

  async complete(prompt: string, _options: LLMCompletionOptions = {}): Promise<string> {
    // If overview generation is requested, return valid JSON adhering to RepoOverviewSectionsSchema
    if (
      prompt.includes("repo_overview_generation") ||
      prompt.includes("Contributor Onboarding Report") ||
      prompt.includes("principal software architect and onboarding mentor")
    ) {
      return JSON.stringify({
        summary: "RepoMentor is an AI-powered repository onboarding assistant designed to eliminate the learning curve of complex codebases.",
        purpose: "Accelerates engineering onboarding by transforming repositories into interactive, grounded architectural workspaces.",
        techStack: [
          { name: "TypeScript", category: "Language", justification: "End-to-end type safety", whyLikelyChosen: "Developer velocity and static type invariants" },
          { name: "Fastify", category: "Framework", justification: "High throughput low overhead", whyLikelyChosen: "Schema-based fast serialization" },
          { name: "PostgreSQL", category: "Database", justification: "Relational integrity with pgvector", whyLikelyChosen: "Unified ACID and vector storage" },
        ],
        architecture: {
          description: "Decoupled three-tier architecture: Next.js frontend, Fastify API gateway, and BullMQ background worker cluster.",
          mermaidDiagram: "flowchart TD\n  Client[Next.js Web] --> API[Fastify Gateway]\n  API --> Redis[(BullMQ Queue)]\n  Redis --> Worker[BullMQ Worker]\n  Worker --> DB[(PostgreSQL 16 + pgvector)]",
        },
        folderStructure: [
          { path: "apps/api", description: "Fastify HTTP API routes and controllers" },
          { path: "apps/web", description: "Next.js App Router UI and chat workspace" },
          { path: "packages/core", description: "Pure domain logic: AST chunking, RAG, and memory" },
        ],
        setupGuide: {
          prerequisites: ["Node.js 22 LTS", "pnpm 9", "Docker"],
          steps: ["pnpm install", "pnpm docker:up", "pnpm dev"],
          troubleshooting: ["Verify Docker daemon is running if Postgres fails to connect"],
        },
        keyFiles: [
          { path: "apps/api/src/server.ts", reason: "API entrypoint and lifecycle hooks", readOrder: 1 },
          { path: "packages/core/src/rag/hybrid-retriever.ts", reason: "Hybrid search and RRF ranking logic", readOrder: 2 },
        ],
        contributionWorkflow: {
          branchNaming: "feat/<feature-name> or fix/<issue-name>",
          prProcess: "Pass all automated CI checks and get 1 code review approval",
          commitFormat: "Conventional Commits: <type>(<scope>): <subject>",
        },
        codeConventions: [
          "Zero use of 'any' in TypeScript code",
          "All HTTP inputs and outputs must validate via Zod schemas",
        ],
        commonPitfalls: [
          "Do not execute code from analyzed repositories",
          "Ensure Docker containers are running before running integration tests",
        ],
        goodFirstAreas: [
          "Adding new Tree-Sitter language WASM grammars",
          "Implementing additional documentation export formats",
        ],
      });
    }

    if (
      prompt.includes("memory_summarizer") ||
      prompt.includes("expert conversation summarizer") ||
      prompt.includes("existing_memory")
    ) {
      return `### Active Goal\nUser is implementing RAG citation verification.\n\n### Comprehension State\nUnderstands RRF formula and pgvector cosine distance.\n\n### Traversed Files\n- packages/core/src/rag/retriever.interface.ts`;
    }

    // Default conversational RAG response with citation
    return "The state dispatcher in React is initialized during reconciler bootstrap [packages/react/src/ReactHooks.js:25-32]. It allows hooks like useState and useEffect to attach to the current fiber node.";
  }

  async stream(
    prompt: string,
    onToken: (token: string) => void,
    options: LLMCompletionOptions = {}
  ): Promise<{ fullText: string; totalTokens?: number }> {
    const text = await this.complete(prompt, options);
    const words = text.split(" ");
    for (const word of words) {
      onToken(word + " ");
    }
    return {
      fullText: text,
      totalTokens: Math.ceil(text.length / 4),
    };
  }
}
