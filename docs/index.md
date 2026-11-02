# Documentation Map & Directory Index - RepoMentor

Welcome to the RepoMentor documentation library. Every document in this repository is cataloged below with a concise summary of its scope and purpose.

---

## 1. Getting Started & User Guides

- [Getting Started Guide (`docs/getting-started.md`)](file:///docs/getting-started.md): Complete local setup guide in under 10 minutes without paid API keys (using Free Gemini or Mock Mode).
- [End-User Guide (`docs/user-guide.md`)](file:///docs/user-guide.md): Visual walkthrough for submitting repositories, exploring reports, chatting with citations, planning code enhancements, plus Troubleshooting and FAQ.

---

## 2. Architecture & Deep Dives

- [System Architecture (`docs/architecture.md`)](file:///docs/architecture.md): High-level system overview, Mermaid component diagrams, and end-to-end data flows for repository indexing and RAG chat.
- [Codebase Tour (`docs/codebase-tour.md`)](file:///docs/codebase-tour.md): Folder-by-folder layout explanation and complete execution flow trace from HTTP request to database.
- [Data Model & Schema (`docs/data-model.md`)](file:///docs/data-model.md): PostgreSQL 16 entity-relationship diagram, Drizzle ORM schemas, and `pgvector` HNSW index configurations.
- [Hybrid RAG & 3-Tier Memory (`docs/rag-and-memory.md`)](file:///docs/rag-and-memory.md): Deep technical breakdown of AST chunking, Reciprocal Rank Fusion ($k=60$), token budgeting, and the 3-layer persistent memory hierarchy.
- [Prompt Catalog & Governance (`docs/prompts.md`)](file:///docs/prompts.md): Master catalog of versioned, type-safe LLM prompt templates and evolution rules.
- [REST API Specification (`docs/api.md`)](file:///docs/api.md): Machine-readable endpoints, request/response schemas, and Server-Sent Event (SSE) stream protocols.

---

## 3. Quality, Security & Operations

- [Testing Strategy & Benchmark Evals (`docs/testing.md`)](file:///docs/testing.md): Vitest unit tests, Fastify API injection tests, prompt injection security tests, and retrieval hit rate benchmark results.
- [Security Threat Model & Policy (`SECURITY.md`)](file:///SECURITY.md): Threat vectors, WASM sandbox isolation, SSRF prevention, CDATA delimiter defense, and vulnerability disclosure protocol.
- [Production Deployment Guide (`docs/deployment.md`)](file:///docs/deployment.md): Multi-stage Dockerfiles, production compose, and PaaS deployment steps for Railway, Render, and AWS.

---

## 4. Contributing & Community

- [Contributing Guidelines (`CONTRIBUTING.md`)](file:///CONTRIBUTING.md): Fork-and-branch workflow, domain areas matrix, good first issues, Conventional Commits, code standards, and PR review guidelines.
- [Contributor Code of Conduct (`CODE_OF_CONDUCT.md`)](file:///CODE_OF_CONDUCT.md): Contributor Covenant v2.1 community pledge and enforcement contact.
- [Project Governance (`GOVERNANCE.md`)](file:///GOVERNANCE.md): Decision-making process, RFC reviews, and maintainer nomination criteria.
- [Product Roadmap (`docs/roadmap.md`)](file:///docs/roadmap.md): Prioritized Now / Next / Later development milestones.
- [Release Changelog (`CHANGELOG.md`)](file:///CHANGELOG.md): Semantic version release notes for v0.1.0, v0.2.0, and v0.3.0.

---

## 5. Architectural Decision Records (ADRs)

Historical decision records preserved in `docs/decisions/`:
- [ADR-0001: Monorepo Architecture with pnpm & Turborepo](file:///docs/decisions/adr-0001-monorepo.md)
- [ADR-0002: Unified PostgreSQL with pgvector for Relational and Semantic Storage](file:///docs/decisions/adr-0002-pgvector.md)
- [ADR-0003: BullMQ and Redis for Asynchronous Ingestion](file:///docs/decisions/adr-0003-bullmq.md)
- [ADR-0004: LLM and Embedding Provider Abstraction Interfaces](file:///docs/decisions/adr-0004-provider-abstraction.md)
- [ADR-0005: 3-Tier Persistent Memory Model](file:///docs/decisions/adr-0005-memory-design.md)
- [ADR-0006: Drizzle ORM and Drizzle-Kit for Type-Safe Migrations](file:///docs/decisions/adr-0006-drizzle-orm.md)
- [ADR-0007: WebAssembly web-tree-sitter for Multi-Language Syntax Parsing](file:///docs/decisions/adr-0007-web-tree-sitter.md)

---

## 6. AI Agent Master Operating Manuals

- [AGENTS.md](file:///AGENTS.md): Master source of truth for autonomous and assisted AI development agents.
- [CLAUDE.md](file:///CLAUDE.md): Directives for Anthropic Claude agents.
- [GEMINI.md](file:///GEMINI.md): Directives for Google Gemini agents.
