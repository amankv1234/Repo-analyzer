# Rule: Testing Strategy & Quality Assurance

## Scope
Universal across all packages and applications.

---

## 1. Test Pyramid & Tooling

RepoMentor adheres to a strict test pyramid:
1. **Unit Tests (Vitest)**: High volume, sub-millisecond execution. Covers pure functions in `packages/core` (chunking, RRF merging, token estimation, memory decay), Zod schemas, error mappers.
2. **Integration Tests (Vitest + Testcontainers / Local Docker)**: Tests Fastify endpoints, BullMQ job processing, Drizzle repositories against real PostgreSQL with `pgvector`.
3. **E2E Tests (Playwright)**: Verifies critical user flows: pasting a repo URL, viewing onboarding sections, submitting a chat question, verifying inline code citations.

---

## 2. Unit Testing Standards

- Test files must be co-located or placed in `tests/`:
  - `my-service.ts` -> `my-service.spec.ts` or `tests/my-service.test.ts`.
- Mock external APIs (Anthropic Claude, Voyage AI, GitHub API) using Vitest `vi.fn()` or Mock Service Worker (MSW).
- Never make real HTTP calls or consume paid LLM API credits in unit test suites.
- Assert explicit invariants rather than snapshotting giant dynamic objects.

---

## 3. Integration Testing Standards

- Database tests must run inside transactions that rollback after each test, or use uniquely generated schema / database names to ensure test isolation.
- Test vector similarity queries with deterministic vectors (e.g., orthogonal test vectors [1, 0, 0] vs [0, 1, 0] vs [0.99, 0.01, 0]) to verify HNSW indexing behavior.
- Fastify route tests should use `fastify.inject()` rather than binding to physical network ports.

---

## 4. Test Coverage & CI Gates

- Minimum unit test coverage target: 80% line coverage for `packages/core` and `packages/shared`.
- CI pipeline (`.github/workflows/ci.yml`) runs:
  1. `pnpm lint`
  2. `pnpm format:check`
  3. `pnpm typecheck`
  4. `pnpm test`
- Any failing test blocks PR merges.

