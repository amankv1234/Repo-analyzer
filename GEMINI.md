# Gemini Agent Guide - RepoMentor

> **Master Reference**: All general architecture, stack requirements, coding standards, and constraints are defined in [AGENTS.md](file:///c:/Users/Amank/OneDrive/Desktop/gsoc/repo%20analyzer/AGENTS.md). **Read and follow `AGENTS.md` before making any changes.**

---

## Gemini-Specific Notes & Operational Directives

1. **Context Window & Large Code Bases**:
   - When inspecting repository AST outputs or vector search candidate sets, leverage Gemini's large context window for comprehensive architectural reviews.
   - However, when constructing LLM prompts for production calls in `packages/core/src/llm`, adhere to strict token budgets defined in `docs/MEMORY_DESIGN.md` and `docs/RAG_DESIGN.md` (the production engine targets Claude 3.5 Sonnet / Haiku).

2. **Sandbox & Tooling Discipline**:
   - In Antigravity / Gemini CLI, always run commands inside the standard sandbox by default.
   - For `pnpm` operations that install packages on Windows (`pnpm install`, `pnpm add`), run outside the sandbox (`BypassSandbox: true`) as required by the environment rules.
   - Always run `pnpm typecheck` and `pnpm test` to verify your changes.

3. **No Halting On Intermediate Background Tasks**:
   - When running asynchronous background tasks or worker jobs, do not poll in a loop; utilize reactive wakeups.

