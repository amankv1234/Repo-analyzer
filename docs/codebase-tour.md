# Codebase Tour & Request Flow - RepoMentor

Welcome to the RepoMentor codebase tour! This guide maps out where code lives across the monorepo and traces the exact execution paths for major operations so you can find the right file in under 5 minutes.

---

## 1. Monorepo Package Directory Map

```text
repomentor/
├── apps/
│   ├── api/          # Fastify HTTP Gateway (REST endpoints, SSE streams, Swagger)
│   ├── web/          # Next.js 14 App Router UI (Tailwind CSS, shadcn/ui, TanStack Query)
│   └── worker/       # BullMQ Background Ingestion Daemon (Git cloning, AST parsing, indexing)
├── packages/
│   ├── core/         # Pure domain logic (AST chunking, hybrid RAG, memory, LLM providers)
│   ├── db/           # PostgreSQL 16 + pgvector schema, migrations, Drizzle ORM repositories
│   ├── prompts/      # Versioned, type-safe LLM prompt templates and schemas
│   └── shared/       # Zod validation schemas, TypeScript interfaces, error classes, env validator
├── scripts/          # Developer tooling (pnpm doctor, seed-mock)
├── docs/             # Comprehensive documentation suite & ADRs
└── .agent/           # AI coding agent rules and workflows
```

---

## 2. Package-by-Package Deep Dive

### 2.1 `apps/web` (Next.js Frontend)
- `app/page.tsx`: Landing page with repository URL input, example codebases, and recent repositories list.
- `app/repos/[id]/page.tsx`: Dynamic onboarding dashboard with tabs for Overview, Chat, Memory, and Enhancement.
- `components/indexing-progress.tsx`: Real-time SSE stage tracker consuming `/api/v1/repos/:id/status`.
- `components/chat-panel.tsx`: RAG streaming chat interface with question intent selector and clickable citations.
- `components/code-viewer.tsx`: Slide-in code drawer displaying syntax-highlighted source code at exact line ranges.
- `components/overview-panel.tsx`: 7-section Contributor Onboarding Report with copy-to-clipboard commands.
- `lib/api-client.ts`: Typed fetch wrapper and SSE streaming consumer for all backend endpoints.

### 2.2 `apps/api` (Fastify Gateway)
- `src/server.ts`: Server bootstrap, port listening, and graceful shutdown signal handlers.
- `src/app.ts`: Fastify app factory registering plugins, route prefixes, and global RFC 7807 error handlers.
- `src/routes/v1/repos.ts`: Repositories CRUD, overview retrieval, file tree viewer, and memory CRUD.
- `src/routes/v1/chat.ts`: Streaming SSE RAG chat (`POST /repos/:id/chat`) and Enhancement Assistant.
- `src/routes/v1/export.ts`: Markdown, CONTRIBUTING.md, and good-first-issues export routes.
- `src/plugins/`: Security headers (`security.ts`), daily token cost guard (`cost-guard.ts`), Prometheus metrics (`metrics.ts`), JWT authentication (`auth.ts`), rate-limiting (`rate-limit.ts`).

### 2.3 `apps/worker` (BullMQ Daemon)
- `src/index.ts`: Worker bootstrap listening on Redis queue `repo-indexing`.
- `src/processors/indexing.processor.ts`: Orchestrates the `RobustIndexingPipeline`, reporting progress percentages and saving reports.

### 2.4 `packages/core` (Pure Domain Business Logic)
- `src/ingestion/`:
  - `github-url.ts`: Strict GitHub URL parser enforcing protocol (`https:`), host (`github.com`), and SSRF safety.
  - `git-cloner.ts`: Shallow (`--depth 1`) isolated cloning engine with 100MB limit and safe temp cleanup.
  - `metadata.ts`: Octokit repository metadata extraction.
  - `file-filter.ts`: Rejects binaries, lockfiles, and oversized files while respecting `.gitignore`.
- `src/analysis/`:
  - `repo-analyzer.ts`: Full non-LLM static analysis extracting file trees, languages, frameworks, entrypoints, and CI/CD configs.
  - `dependency-parser.ts`: Deterministic manifest parser across `package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`, `pom.xml`.
- `src/chunking/`:
  - `ast-chunker.ts`: Hierarchical AST symbol chunker maintaining 300-800 token targets.
  - `ast-symbol-extractor.ts`: Tree-sitter WASM symbol extractor for TS/JS, Python, Go, Rust, Java, C/C++.
  - `markdown-chunker.ts`: Heading-aware document splitter.
- `src/embeddings/`:
  - `voyage.provider.ts`: Voyage AI dense embedding integration.
  - `embedding-cache.ts`: SHA-256 content-hash caching preventing duplicate embedding calls.
  - `mock-embedding.provider.ts`: Deterministic offline vector generator.
- `src/llm/`:
  - `gemini.provider.ts`: Free Google Gemini Flash REST provider using native fetch.
  - `anthropic.provider.ts`: Claude 3.5 Sonnet / Haiku client.
  - `mock-llm.provider.ts`: Deterministic offline response generator for unit tests.
- `src/rag/`:
  - `hybrid-retriever.ts`: Dual pgvector cosine similarity + Postgres full-text search with Reciprocal Rank Fusion ($k=60$).
  - `query-rewriter.ts`: Follow-up pronoun resolution.
  - `intent-router.ts`: 5 question archetypes.
  - `citation-parser.ts`: `[file:start-end]` extraction and boundary validation.
- `src/memory/`:
  - `token-budgeter.ts`: XML prompt assembly and budget trimming.
  - `memory-summarizer.ts`: Episodic profile synthesizer.
- `src/enhancement/`:
  - `enhancement-assistant.ts`: Impact analysis, test strategy, and unified code diff generation.

### 2.5 `packages/db` (Data Layer)
- `src/schema/index.ts`: PostgreSQL 16 schema definitions (`users`, `repositories`, `repo_files`, `code_chunks`, `repo_overviews`, `conversations`, `messages`, `memory_records`, `indexing_jobs`).
- `src/schema/custom-types.ts`: Drizzle custom types for `vector(1536)` and `tsvector`.
- `src/repositories/index.ts`: Typed DAOs for database queries and vector distance lookups.

---

## 3. End-to-End Request Tracing

### Flow 1: Indexing a Repository
1. **User clicks Submit**: `apps/web/components/repo-input.tsx` calls `api.submitRepo(url)`.
2. **API validates & queues**: `apps/api/src/routes/v1/repos.ts` validates URL with Zod, creates a `repositories` record, and adds a job to BullMQ queue `repo-indexing`.
3. **Worker picks up job**: `apps/worker/src/processors/indexing.processor.ts` receives payload and runs `RobustIndexingPipeline.execute()`.
4. **Cloning**: `packages/core/src/ingestion/git-cloner.ts` performs shallow clone into `/tmp/repomentor/...`.
5. **Static Analysis**: `packages/core/src/analysis/repo-analyzer.ts` extracts `RepoFacts` (no LLM).
6. **AST Chunking**: `packages/core/src/chunking/ast-chunker.ts` splits code at function/class boundaries via WASM tree-sitter.
7. **Embeddings & Persistence**: Chunks are embedded via `GeminiProvider`/`VoyageAI` and persisted in `code_chunks` (`pgvector` column + `tsvector`).
8. **Overview Synthesis**: `packages/core/src/overview/overview-generator.ts` calls Claude/Gemini with `repo-overview.prompt.ts`, parses JSON sections, and persists to `repo_overviews`.
9. **Finalization & Cleanup**: Cloned temp directory is deleted; job marked `completed`; status set to `ready`.

### Flow 2: Asking a RAG Question with Citations
1. **User submits question**: `apps/web/components/chat-panel.tsx` calls `fetchChatStream(repoId, question)`.
2. **HTTP Handler**: `apps/api/src/routes/v1/chat.ts` receives `POST /repos/:id/chat` and configures `text/event-stream` SSE headers.
3. **Query Rewriting**: `query-rewriter.ts` transforms follow-up questions into standalone search queries.
4. **Hybrid Retrieval**: `hybrid-retriever.ts` queries pgvector cosine similarity and Postgres full-text search, merging results with RRF ($k=60$).
5. **Token Assembly**: `token-budgeter.ts` packs XML blocks (system prompt + repo overview + memory + retrieved chunks + history).
6. **Streaming LLM**: `llm.stream()` emits tokens to the client via `event: token`.
7. **Citation Extraction**: `citation-parser.ts` extracts `[file:start-end]` badges and streams `event: citation`.
8. **User Interaction**: Clicking a badge in the web UI opens `code-viewer.tsx` to inspect the code lines directly.

