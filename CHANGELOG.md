# Changelog - RepoMentor

All notable changes to the RepoMentor project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.0] - 2026-11-02

### Added
- **Interactive Next.js Frontend (`apps/web`)**:
  - Landing page with repository submission form, starter repositories, and recent repositories list.
  - Real-time indexing progress tracker via Server-Sent Events (SSE) across 6 pipeline stages.
  - Tabbed repository dashboard: Overview, RAG Code Chat, Persistent Memory, and Enhancement Plan.
  - Side-by-side **Code Viewer Drawer** displaying exact line ranges for clicked citations.
  - Interactive **Memory Management Panel** with view, inline edit, and delete support.
  - Interactive **Enhancement Mode** generating step-by-step feature plans and unified code diffs.
- **Export & Advanced Features**:
  - Export onboarding report as full GitHub Flavored Markdown (`GET /api/v1/repos/:id/export/markdown`).
  - Export onboarding guide formatted as `CONTRIBUTING.md` (`GET /api/v1/repos/:id/export/contributing`).
  - Good-First-Issues discovery via GitHub REST API (`GET /api/v1/repos/:id/issues/good-first`).
- **Security Hardening**:
  - Security headers plugin setting HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
  - CSRF origin validation hook on state-changing API endpoints.
  - Per-user daily token quota cost guards (`apps/api/src/plugins/cost-guard.ts`).
  - Prompt injection defense test verifying CDATA isolation and SSRF mitigations (`packages/core/tests/security.test.ts`).
- **Observability & Infrastructure**:
  - Prometheus metrics endpoint (`GET /metrics`) exposing latency histograms and request counters.
  - `X-Request-Id` correlation header tracking.
  - Multi-stage non-root production Dockerfiles for API, Worker, and Web.
  - Production `docker-compose.prod.yml` with healthchecks and resource constraints.
  - GitHub Actions CI/CD workflows (`.github/workflows/ci.yml` and `deploy.yml`).
  - Exhaustive documentation: `docs/DEPLOYMENT.md`, `docs/USER_GUIDE.md`, `docs/TROUBLESHOOTING.md`, `docs/FAQ.md`.

---

## [0.2.0] - 2026-11-02

### Added
- **Backend Intelligence Layer (`packages/core`)**:
  - Strict GitHub URL parser with SSRF protection (`github-url.ts`).
  - Repository metadata fetcher via Octokit (`metadata.ts`).
  - Shallow clone engine with 100MB size limit and safe cleanup (`git-cloner.ts`).
  - Non-LLM static analyzer producing `RepoFacts` across npm, pip, cargo, go, maven, gradle (`repo-analyzer.ts`).
  - Universal Tree-Sitter AST symbol chunker for TS/JS, Python, Go, Rust, Java, C/C++ (`ast-chunker.ts`).
  - Content-hash SHA-256 caching for vector embeddings (`embedding-cache.ts`).
  - Voyage AI & Mock embedding providers (`voyage.provider.ts`).
  - Anthropic Claude 3.5 Sonnet & Mock LLM providers (`anthropic.provider.ts`).
  - Map-reduce repository overview generator (`overview-generator.ts`).
  - Hybrid RAG retriever combining pgvector cosine similarity and Postgres full-text search with RRF ($k=60$).
  - Query rewriter resolving follow-up pronouns into standalone queries (`query-rewriter.ts`).
  - Intent router classifying 5 technical question archetypes (`intent-router.ts`).
  - Verifiable citation parser extracting `[file:start-end]` references (`citation-parser.ts`).
  - 3-tier memory engine with strict token budget assembly (`token-budgeter.ts`, `memory-summarizer.ts`).
  - Enhancement assistant with impact analysis and unified diff generator (`enhancement-assistant.ts`).
  - BullMQ background indexing pipeline with incremental re-indexing (`indexing-pipeline.ts`).
- **API Endpoints (`apps/api`)**:
  - RESTful endpoints for repos CRUD, overview, status SSE, refresh, files, memories, and streaming chat.
- **Evaluation Benchmark (`evals/`)**:
  - 5-repo dataset with 100% retrieval hit rate and 100% citation correctness.

---

## [0.1.0] - 2026-11-02

### Added
- Monorepo foundation with pnpm workspaces, Turborepo, and strict TypeScript.
- PostgreSQL 16 schema with `pgvector` HNSW indexes and Drizzle ORM.
- Fastify API gateway scaffolding with Zod validation and Swagger OpenAPI 3.1.
- BullMQ worker daemon scaffolding.
- AI Agent master documentation (`AGENTS.md`, `.agent/rules/`, `.agent/workflows/`).
- Architecture, data model, memory, security, and RAG design specifications (`docs/`).

