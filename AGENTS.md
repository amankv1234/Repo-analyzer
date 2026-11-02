# RepoMentor - AI Agent Master Operating Manual (AGENTS.md)
*Single Source of Truth for Autonomous and Assisted AI Development Agents*

---

## 1. Project Summary & Core Mission
**RepoMentor** is an AI-powered repository onboarding assistant designed to eliminate the steep learning curve of unfamiliar codebases for software engineers, open-source contributors, and engineering managers.

A user provides a Git repository URL (e.g., GitHub/GitLab). RepoMentor:
1. Performs a shallow, secure clone and extracts metadata.
2. Parses abstract syntax trees (AST) at the class, interface, and function levels using `web-tree-sitter`.
3. Embeds semantic code units using vector embeddings (Voyage AI / HuggingFace Transformers fallback) and indexes full-text lexical tokens (PostgreSQL `tsvector`).
4. Generates an exhaustive **Contributor Onboarding Report** (project rationale, architecture diagrams, folder structure, local dev setup, high-impact files, and contribution guidelines).
5. Powers a **RAG Chat Assistant** that answers questions with exact line-level source code citations.
6. Maintains a **3-Layer Persistent Memory** per `(user, repo)` across short-term context, repository evolution, and long-term user comprehension goals.

---

## 2. Strict Technology Stack & Pinned Baseline Versions

All agents must strictly adhere to this technology matrix. **No deviations or unapproved libraries are permitted without an approved Architectural Decision Record (ADR) in `docs/DECISIONS/`**.

| Component | Technology | Version / Spec | Justification |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `22.x LTS` (Active) | Native fetch, Web Streams, performance, LTS stability |
| **Language** | TypeScript | `5.5+` | Strict mode enabled, zero untyped code |
| **Package Manager** | pnpm | `9.x / 11.x` | Content-addressable storage, strict peer isolation |
| **Monorepo Engine** | Turborepo | `2.x` | Remote caching, topological task execution |
| **Frontend Framework** | Next.js (App Router) | `14.2+ / 15.x` | React Server Components, Streaming SSR, Edge runtime |
| **Styling & UI** | Tailwind CSS + shadcn/ui | Tailwind v3.4+, Radix UI | Accessible primitives, zero-runtime CSS |
| **Client State / Cache** | TanStack Query | `v5.x` | Server-state caching, optimistic updates |
| **HTTP API Framework** | Fastify | `4.x / 5.x` | High-throughput low-overhead async server |
| **API Validation** | Zod | `3.23+` | Runtime parsing, static inference, OpenAPI bridge |
| **OpenAPI / Swagger** | `@fastify/swagger` + UI | OpenAPI 3.1 | Machine-readable schemas, client code generation |
| **Primary Database** | PostgreSQL | `16.x` | Robust ACID, JSONB support, extensive indexing |
| **Vector Engine** | `pgvector` extension | `0.7+` | HNSW cosine similarity index inside Postgres |
| **ORM & Migrations** | Drizzle ORM + drizzle-kit | `0.33+` / `0.24+` | Zero-overhead SQL-like syntax, safe migrations |
| **Job Queue & Cache** | BullMQ + Redis | `BullMQ 5.x`, `Redis 7.x` | Resilient background processing, rate limiting |
| **LLM Provider** | Anthropic Claude SDK | `@anthropic-ai/sdk 0.26+` | Claude 3.5 Sonnet / Haiku for analysis & RAG |
| **Embedding Provider** | Voyage AI / Transformers | `voyageai 0.1+` / `@xenova/transformers` | 1536/1024-dim code embeddings |
| **AST Code Parsing** | `web-tree-sitter` | `0.22+` (WASM grammars) | Multi-language syntax parsing without native C++ toolchain |
| **Git Operations** | Octokit + simple-git | `octokit 4.x`, `simple-git 3.25+` | Shallow clones, tarball streaming, commit analysis |
| **Logging & Metrics** | Pino + prom-client | `pino 9.x`, `prom-client 15.x` | Structured JSON logging with trace correlation |
| **Test Runners** | Vitest + Playwright | `vitest 2.x`, `playwright 1.46+` | Fast ESM unit testing & headless E2E testing |

---

## 3. Monorepo Architecture & Directory Map

```text
repomentor/
├── .agent/                         # AI agent instructions, workflows, and rule sets
│   ├── rules/                      # Domain-specific constraints (backend, frontend, security, etc.)
│   └── workflows/                  # Step-by-step checklists for recurring engineering tasks
├── apps/
│   ├── api/                        # Fastify HTTP REST API service
│   │   ├── src/
│   │   │   ├── plugins/            # Fastify plugins (CORS, Swagger, Auth, DB, Redis)
│   │   │   ├── routes/             # REST route handlers organized by domain (v1/repos, v1/chat)
│   │   │   └── server.ts           # Server initialization and lifecycle hooks
│   │   ├── Dockerfile
│   │   └── tsconfig.json
│   ├── web/                        # Next.js frontend application (App Router)
│   │   ├── app/                    # Next.js App Router (pages, layouts, route handlers)
│   │   ├── components/             # Reusable UI components (shadcn/ui + custom widgets)
│   │   ├── hooks/                  # Custom React hooks (TanStack queries, SSE listeners)
│   │   ├── lib/                    # Client utilities, API fetch wrappers
│   │   └── tsconfig.json
│   └── worker/                     # BullMQ background job processor
│       ├── src/
│       │   ├── processors/         # Queue job processors (repo-indexing, file-chunking)
│       │   ├── queues/             # BullMQ queue instantiations
│       │   └── index.ts            # Worker daemon bootstrap & graceful shutdown
│       ├── Dockerfile
│       └── tsconfig.json
├── packages/
│   ├── core/                       # Pure domain interfaces, algorithms, and business logic
│   │   ├── src/
│   │   │   ├── chunking/           # AST-aware code chunker interfaces
│   │   │   ├── embeddings/         # EmbeddingProvider abstraction & implementations
│   │   │   ├── ingestion/          # Git cloning & repository filtering interfaces
│   │   │   ├── llm/                # LLMProvider abstraction & Claude client wrapper
│   │   │   ├── memory/             # 3-tier memory management & summarizer contracts
│   │   │   ├── parser/             # Tree-sitter grammar loaders & symbol extractors
│   │   │   └── rag/                # Hybrid search (vector + fulltext) & RRF reranking
│   │   └── tsconfig.json
│   ├── db/                         # Database schema, migrations, and typed repositories
│   │   ├── drizzle/                # SQL migration files managed by drizzle-kit
│   │   ├── src/
│   │   │   ├── client.ts           # Drizzle instance and connection pool configuration
│   │   │   ├── repositories/       # Data Access Object (DAO) repositories
│   │   │   └── schema/             # Drizzle table definitions & vector indexes
│   │   ├── drizzle.config.ts
│   │   └── tsconfig.json
│   ├── prompts/                    # Versioned, strictly tracked LLM prompts
│   │   ├── src/
│   │   │   ├── v1/                 # Version 1 prompt templates & schemas
│   │   │   └── index.ts            # Central catalog and prompt retrieval functions
│   │   └── tsconfig.json
│   └── shared/                     # Zod schemas, TypeScript types, and utilities
│       ├── src/
│       │   ├── env.ts              # Universal environment variable validator
│       │   ├── errors/             # Shared standard error classes
│       │   ├── schemas/            # Zod validation schemas for requests/responses
│       │   └── types/              # Inferred types and common data transfer objects
│       └── tsconfig.json
├── docs/                           # Architecture, PRD, Data Model, Security & ADRs
│   ├── DECISIONS/                  # Architectural Decision Records (ADRs)
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── MEMORY_DESIGN.md
│   ├── PRD.md
│   ├── PROMPTS.md
│   ├── RAG_DESIGN.md
│   ├── ROADMAP.md
│   └── SECURITY.md
├── .env.example                    # Exhaustive environment variable specification
├── docker-compose.yml              # Local development stack (Postgres + pgvector, Redis)
├── pnpm-workspace.yaml             # pnpm workspace definition
├── turbo.json                      # Turborepo task pipeline configuration
├── tsconfig.base.json              # Shared TypeScript compiler options (strict)
└── AGENTS.md                       # This document
```

---

## 4. Layering and Architectural Boundaries

```
[ HTTP Layer (apps/api) / UI Layer (apps/web) / Worker Layer (apps/worker) ]
                                   │
                                   ▼
                   [ Domain Services (packages/core) ]
                 (Framework-independent business logic)
                                   │
                                   ▼
             [ Data Access Repositories (packages/db/repositories) ]
                                   │
                                   ▼
                     [ Database Schema & Drizzle ORM ]
                                   │
                                   ▼
                  [ PostgreSQL 16 + pgvector Database ]
```

### Strict Boundary Rules:
1. **Framework Agnosticism**: `packages/core` must **NEVER** import from `fastify`, `next`, or `bullmq`. It must remain 100% portable TypeScript.
2. **Layer Inversion**: Route handlers never query the database directly. They call domain services, which call typed repositories in `packages/db`.
3. **No Cross-App Imports**: `apps/api` cannot import from `apps/web` or `apps/worker`. All shared code resides in `packages/shared`, `packages/core`, or `packages/db`.
4. **Validation at Edges**: Any data crossing network boundaries (HTTP requests, BullMQ job payloads, LLM responses) must be validated via Zod schemas defined in `packages/shared`.

---

## 5. Development & Verification Commands

Agents must run these standard commands. Do not improvise shell commands.

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Install Dependencies** | `pnpm install` | Install all workspace packages cleanly |
| **Run Dev Stack** | `pnpm dev` | Start API, Web, Worker concurrently via Turborepo |
| **Docker Services Up** | `pnpm docker:up` | Spin up Postgres (pgvector) and Redis |
| **Docker Services Down** | `pnpm docker:down` | Stop dev containers without removing volumes |
| **Generate Migrations**| `pnpm --filter @repomentor/db db:generate` | Generate SQL migration from schema diff |
| **Apply Migrations**   | `pnpm --filter @repomentor/db db:migrate`  | Execute pending migrations against target DB |
| **Seed Database**      | `pnpm --filter @repomentor/db db:seed`     | Seed baseline test data |
| **Typecheck All**      | `pnpm typecheck` | Run `tsc --noEmit` across all workspaces |
| **Lint Code**          | `pnpm lint` | Execute ESLint across all projects |
| **Format Check**       | `pnpm format:check` | Run Prettier verification |
| **Format Fix**         | `pnpm format` | Auto-format codebase with Prettier |
| **Unit & Integration** | `pnpm test` | Run Vitest unit & integration suites |
| **Build Artifacts**    | `pnpm build` | Compile all apps and packages |

---

## 6. Coding Conventions & Code Standards

### 6.1 TypeScript Strictness
- `noImplicitAny`: `true`
- `strictNullChecks`: `true`
- `exactOptionalPropertyTypes`: `true`
- `noUncheckedIndexedAccess`: `true`
- **NEVER** use `any`. If an unknown type is encountered, use `unknown` and narrow it with Zod or type guards. If `any` is mathematically unavoidable for an external untyped C-WASM module, it must be accompanied by `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- <Justification>`.

### 6.2 Naming Rules
- **Files & Directories**: `kebab-case.ts` (e.g., `git-cloner.service.ts`, `repo-card.tsx`).
- **Interfaces & Types**: `PascalCase` (e.g., `LLMProvider`, `RepositoryMetadata`). Interfaces representing contracts must be descriptive (avoid leading `I`).
- **Classes**: `PascalCase` (e.g., `AnthropicClaudeProvider`).
- **Functions & Methods**: `camelCase`, beginning with an active verb (e.g., `extractSymbols()`, `generateReport()`, `findChunkById()`).
- **Constants & Enums**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_CHUNK_SIZE`, `MAX_RETRIES`).
- **Database Tables & Columns**: `snake_case` (e.g., `repo_files`, `last_indexed_commit`).

### 6.3 Error Handling & Logging
- Never throw raw strings or generic `Error`. Use custom error classes inheriting from `AppError` in `packages/shared/src/errors/`.
- Every error must define: `code` (e.g., `REPO_NOT_FOUND`), `statusCode` (e.g., 404), `message`, and optional structured `details`.
- Log with Pino using structured context. **Never use `console.log`**.
  ```typescript
  // CORRECT
  logger.error({ err, repoId, durationMs }, "Failed to complete AST parsing for repository");
  
  // WRONG
  console.log("Error indexing repo " + repoId, err);
  ```

---

## 7. Absolute Non-Negotiables ("What Agents Must NEVER Do")

> [!CAUTION]
> Violation of any item in this section will result in immediate rejection of changes during automated verification and review.

1. **NEVER execute code from analyzed repositories**: When cloning or parsing a target repository, **never** run `npm install`, `make`, `python setup.py`, build scripts, test runners, or evaluate any code from the analyzed repository. The cloned repository is untrusted input data. Only read its text files and parse ASTs via WASM.
2. **NEVER commit secrets, API keys, or credentials**: Never hardcode tokens (`sk-ant-...`, passwords, connection strings) in code, tests, mock files, or docs. Use `.env` backed by `.env.example`.
3. **NEVER edit already-applied database migrations**: Once a migration SQL file exists in `packages/db/drizzle/`, it is immutable. To alter schema, create a new forward migration via `pnpm db:generate`.
4. **NEVER bypass type checks or tests**: Do not use `@ts-ignore` (use `@ts-expect-error` with explanatory comment only if strictly necessary), do not use `any`, and never comment out failing test cases to make CI green.
5. **NEVER introduce inline LLM prompts**: Every prompt sent to an LLM must originate from `packages/prompts` with an explicit semantic version (e.g., `prompts/v1/repo-overview.ts`).
6. **NEVER construct raw unparameterized SQL queries**: Always use Drizzle query builders or `sql` tagged template literals with parameter bindings to prevent SQL injection.
7. **NEVER perform synchronous heavy computation in HTTP handlers**: AST parsing, cloning, embedding generation, and LLM summarization must run asynchronously in BullMQ worker tasks (`apps/worker`).

---

## 8. Git & Commit Protocol (Conventional Commits)

Commit messages must strictly follow the Conventional Commits specification:
`<type>(<scope>): <short description>`

### Types:
- `feat`: A new user-facing feature or API endpoint.
- `fix`: A bug fix.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `perf`: A code change that improves performance.
- `test`: Adding missing tests or correcting existing tests.
- `docs`: Documentation updates only.
- `chore`: Build process, dependencies, tooling updates.

### Examples:
- `feat(api): add repository indexing trigger endpoint`
- `fix(db): add missing compound index on code_chunks (repo_id, file_id)`
- `docs(rag): document RRF hybrid retrieval merge algorithm`

---

## 9. Definition of Done (DoD) Checklist

Before declaring any task, feature, or PR complete, every agent must verify:
- [ ] Code strictly follows all architectural layers and imports.
- [ ] All inputs and outputs are validated with Zod schemas.
- [ ] No `any` types were introduced without an explicit justification comment.
- [ ] New database changes include a versioned Drizzle migration file.
- [ ] All existing and new tests pass (`pnpm test`).
- [ ] Zero TypeScript errors exist (`pnpm typecheck`).
- [ ] ESLint and Prettier checks pass (`pnpm lint && pnpm format:check`).
- [ ] API routes include OpenAPI parameter and response annotations.
- [ ] Documentation (`docs/`, `.agent/`, `README.md`) updated if contracts changed.

