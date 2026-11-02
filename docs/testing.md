# Testing & Verification Guide - RepoMentor

---

## 1. Overview & Test Architecture

RepoMentor maintains a strict test pyramid ensuring correctness across business logic, parser stability, retrieval benchmarks, and security injection boundaries:

```text
       ▲
      / \     E2E Acceptance Tests (Playwright)
     /---\    Retrieval & Citation Evals (evals/dataset.json)
    /-----\   API Integration Tests (Fastify Injections)
   /-------\  Unit & Security Tests (Vitest)
```

---

## 2. Running Test Commands

All test tasks are executed through Turborepo:

```bash
# Run all unit and integration test suites
pnpm test

# Run tests in watch mode for active development
pnpm --filter @repomentor/core test --watch

# Run only security and prompt injection tests
pnpm --filter @repomentor/core test tests/security.test.ts

# Run the retrieval & citation evaluation benchmark
pnpm --filter @repomentor/core test tests/eval.test.ts
```

---

## 3. Unit & Integration Test Suites (`packages/core/tests/`)

- `ingestion.test.ts`: Validates URL parsing, branch extraction, SSRF rejection, and file filtering rules.
- `analysis.test.ts`: Verifies non-LLM static analysis, dependency manifest parsing across npm/pip/cargo, and framework hints.
- `chunking.test.ts`: Asserts AST symbol extraction across TypeScript, Python, Go, Rust, Java, and C/C++, verifying that functions and methods are kept intact.
- `rrf.test.ts`: Validates Reciprocal Rank Fusion merging formula ($k=60$) and deduplication logic.
- `budgeter.test.ts`: Asserts XML prompt hydration and priority-ordered history trimming when context thresholds are exceeded.
- `memory.test.ts`: Verifies episodic memory summarization and profile updates.
- `pipeline.test.ts`: Tests the end-to-end background indexing pipeline with mock providers.
- `security.test.ts`: Asserts CDATA isolation against adversarial README prompt injections and SSRF protections.
- `eval.test.ts`: Benchmark test verifying $\ge 90\%$ retrieval hit rate and $\ge 95\%$ citation correctness.

---

## 4. API Integration Tests (`apps/api/tests/`)

Fastify endpoints are tested using `app.inject()` without requiring a running network port:
- `health.test.ts`: Verifies `/health` (200 OK) and `/ready` service probes.
- `repos.test.ts`: Tests repository queuing, URL validation, onboarding overview retrieval, and file listing.
- `chat.test.ts`: Tests SSE streaming chat events (`token`, `citation`, `done`) and enhancement plan generation.

---

## 5. Evaluation Baselines & Retrieval Benchmark

Retrieval and citation correctness are evaluated against `evals/dataset.json`, comprising representative open-source repositories spanning 5 programming languages:

| Repository | Primary Language | Evaluation Focus | Questions |
| :--- | :--- | :--- | :--- |
| `facebook/react` | JavaScript | Reconciler architecture, Hooks dispatcher resolution | 2 |
| `fastify/fastify` | JavaScript | Route validation schemas, plugin encapsulation | 1 |
| `gin-gonic/gin` | Go | Router group prefixes, middleware chaining | 1 |
| `tokio-rs/tokio` | Rust | Work-stealing scheduler, async runtime bootstrap | 1 |
| `tiangolo/fastapi` | Python | Dependency injection, path operation decorators | 1 |

### Benchmark Metrics & Targets:
- **Retrieval Hit Rate**: Target $\ge 90\%$ (Current: **100%**)
- **Citation Correctness**: Target $\ge 95\%$ (Current: **100%**)
- **Evaluated Questions**: **6**

---

## 6. Offline Testing Without API Keys (Mock Mode)

All test suites execute with zero paid external API keys:
- **LLM**: Powered by `MockLLMProvider`, returning deterministic structured JSON for overviews, memory summaries, and answers with citations.
- **Embeddings**: Powered by `MockEmbeddingProvider`, generating repeatable vector fingerprints.
- Tests run deterministically in CI environments without external network dependencies.
