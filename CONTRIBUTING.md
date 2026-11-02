# Contributing to RepoMentor

Thank you for your interest in contributing to **RepoMentor**! We are building the next-generation AI onboarding assistant to eliminate the steep learning curve of unfamiliar software repositories.

We welcome contributions from software engineers, open-source newcomers, technical writers, and designers.

---

## 1. Code of Conduct

All contributors and maintainers are expected to follow our [Code of Conduct](file:///CODE_OF_CONDUCT.md). Please report any unacceptable behavior to `conduct@repomentor.dev`.

---

## 2. Zero-Cost Local Development (Running Without Paid API Keys)

You do **not** need a paid Claude or Voyage API key to contribute to RepoMentor:
- **Free Google Gemini Mode**: Set `GEMINI_API_KEY` in `.env` using a free key from [Google AI Studio](https://aistudio.google.com).
- **Offline Mock Mode**: Set `LLM_PROVIDER=mock` and `EMBEDDING_PROVIDER=mock` in `.env` (or run `pnpm dev:mock`).
- **Pre-seeded Fixture**: Run `pnpm seed:mock` to populate a demo repository in your local database immediately.

---

## 3. Quick Local Setup

1. **Fork and clone**:
   ```bash
   git clone https://github.com/<your-username>/repomentor.git
   cd repomentor
   ```
2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
3. **Start infrastructure & verify**:
   ```bash
   pnpm docker:up
   pnpm install
   pnpm --filter @repomentor/db db:migrate
   pnpm doctor
   ```
4. **Start the development servers**:
   ```bash
   pnpm dev
   ```

---

## 4. How to Find Something to Work On

### 4.1 Domain Areas Matrix
| Area | Key Responsibilities | Primary Technologies | Target Folders | Difficulty |
| :--- | :--- | :--- | :--- | :---: |
| **Frontend UI/UX** | Dashboard tabs, SSE streaming listeners, code drawer, responsive layouts | Next.js 14, React 18, Tailwind CSS, shadcn/ui | `apps/web/` | 🟢 Beginner to 🟡 Intermediate |
| **API Gateway** | REST route controllers, OpenAPI schemas, security plugins, rate limiting | Fastify 4, Zod, jose (JWT) | `apps/api/` | 🟡 Intermediate |
| **Worker & Ingestion**| Shallow clones, temp isolation, BullMQ job queues, concurrency limits | BullMQ 5, Redis 7, simple-git, Octokit | `apps/worker/`, `packages/core/src/ingestion/` | 🟡 Intermediate |
| **AST Code Parsing** | Symbol extraction, tree-sitter grammars, syntax node filtering | `web-tree-sitter` (WASM), C/C++ grammars | `packages/core/src/chunking/` | 🔴 Advanced |
| **Hybrid RAG & Search**| Vector cosine search, PostgreSQL full-text search, RRF reranking | `pgvector`, tsvector, Voyage AI, Gemini | `packages/core/src/rag/` | 🔴 Advanced |
| **3-Tier Memory** | Token budgeting, episodic summarizer, deduplication, JSONB storage | TypeScript, Drizzle ORM, Claude/Gemini | `packages/core/src/memory/` | 🟡 Intermediate |
| **Prompt Engineering**| Designing and testing versioned system prompts, map-reduce overview | `packages/prompts/` | `packages/prompts/src/v1/` | 🟢 Beginner |
| **Evals & Benchmarks**| Adding benchmark repositories, measuring retrieval hit rate | Vitest, TypeScript, JSON | `evals/` | 🟢 Beginner |
| **Documentation & DX**| User guides, interactive walkthroughs, troubleshooting, translations | Markdown, Mermaid.js | `docs/`, `README.md` | 🟢 Beginner |
| **DevOps & Infra** | Docker multi-stage images, docker-compose, CI/CD, Kubernetes | Docker, GitHub Actions, Linux | `docker-compose.yml`, `.github/` | 🟡 Intermediate |

### 4.2 Top Good First Issues
- **[UI] Keyboard Shortcuts to Navigation Tabs**: Toggle tabs with `1-4` in `apps/web/app/repos/[id]/page.tsx`.
- **[UI] Syntax Highlighting in Code Drawer**: Syntax coloration in `apps/web/components/code-viewer.tsx`.
- **[Core] Ruby AST Tree-Sitter Grammar**: Extract classes and methods from `.rb` files in `packages/core/src/chunking/`.
- **[UI] Dark/Light Mode Theme Toggle**: Add theme switcher in `apps/web/components/header.tsx`.
- **[API] PDF Export Route**: Generate PDF onboarding guides in `apps/api/src/routes/v1/export.ts`.
- **[Roadmap]**: Check [`docs/roadmap.md`](file:///docs/roadmap.md) for full Now / Next / Later feature priorities.

---

## 5. Development Workflow & Step-by-Step Guides

When implementing changes, follow the established agent workflows in `.agent/workflows/`:
- Adding an API endpoint: [`.agent/workflows/add-new-api-endpoint.md`](file:///.agent/workflows/add-new-api-endpoint.md)
- Adding a database migration: [`.agent/workflows/add-db-migration.md`](file:///.agent/workflows/add-db-migration.md)
- Adding an AST language parser: [`.agent/workflows/add-new-language-parser.md`](file:///.agent/workflows/add-new-language-parser.md)
- Adding an LLM prompt: [`.agent/workflows/add-new-llm-prompt.md`](file:///.agent/workflows/add-new-llm-prompt.md)

---

## 6. Git & Commit Guidelines (Conventional Commits)

Commit messages must strictly follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
`<type>(<scope>): <short description>`

### Allowed Types:
- `feat`: A new feature or endpoint.
- `fix`: A bug fix.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `perf`: Performance improvement.
- `test`: Adding or correcting tests.
- `docs`: Documentation updates only.
- `chore`: Tooling, dependencies, or configuration changes.

---

## 7. Quality Gates (Pre-PR Verification)

Before opening a pull request, run all quality gates locally:
```bash
# 1. Run all unit and integration tests
pnpm test

# 2. Verify strict TypeScript types (zero errors)
pnpm typecheck

# 3. Check linting and code formatting
pnpm lint
pnpm format:check
```

---

## 8. AI-Assisted Contribution Policy

We welcome the responsible use of AI tools (GitHub Copilot, Cursor, Gemini, Claude):
- **Author Responsibility**: You are 100% accountable for every line of code committed. You must understand, test, and be able to explain all changes.
- **No Hallucinated Code**: Do not commit invented library functions, broken imports, or untested placeholders.
- **Pass All Tests**: AI-assisted code must strictly pass `pnpm typecheck` and `pnpm test`.

---

## 9. Pull Request Review Expectations & Timelines

1. **Initial Review SLA**: A maintainer will triage and provide initial feedback on your PR within **48 to 72 hours**.
2. **CI Gates**: All automated GitHub Actions checks (lint, typecheck, tests, secret scanning) must be green.
3. **Approval**: At least one maintainer review approval is required prior to merging.

---

## 10. Asking Questions & Reporting Bugs

- **Questions & Ideas**: Open a thread in [GitHub Discussions](https://github.com/your-org/repomentor/discussions).
- **Bug Reports**: Open a structured issue using our [Bug Report Form](https://github.com/your-org/repomentor/issues/new?template=bug_report.yml).
- **Security Vulnerabilities**: Email `security@repomentor.dev` directly. Do not report security vulnerabilities in public issues.
