# Claude Agent Guide - RepoMentor

> **Master Reference**: All general architecture, stack requirements, coding standards, and constraints are defined in [AGENTS.md](file:///c:/Users/Amank/OneDrive/Desktop/gsoc/repo%20analyzer/AGENTS.md). **Read and follow `AGENTS.md` before making any changes.**

---

## Claude-Specific Notes & Operational Directives

1. **Production LLM Target Awareness**:
   - RepoMentor is built with the Anthropic Claude SDK (`@anthropic-ai/sdk`) for production intelligence (e.g., Claude 3.5 Sonnet for detailed code reasoning and onboarding analysis, Claude 3.5 Haiku for memory summarization and rapid classification).
   - Ensure all prompt templates in `packages/prompts` use system prompts, structured XML tags (`<context>`, `<code_chunks>`, `<instructions>`, `<citations>`), and strict output format specifications that Sonnet and Haiku excel at parsing.

2. **Strict Type Safety & Non-Negotiables**:
   - Claude must never suggest or use `any` in TypeScript files.
   - Claude must ensure every Fastify route handler has a corresponding Zod schema for params, query, body, and responses.
   - Ensure all database queries use typed Drizzle schema operators, preventing raw SQL vulnerabilities.

3. **Autonomous Task Execution**:
   - Always refer to `.agent/workflows/` before executing multi-step operations like adding an API endpoint, generating migrations, or adding a parser.

