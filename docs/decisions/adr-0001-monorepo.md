# ADR-0001: Monorepo Architecture with pnpm Workspaces and Turborepo

## Status
Accepted

## Context
RepoMentor is composed of multiple applications (Next.js frontend, Fastify HTTP API, BullMQ background worker) and reusable packages (domain logic, database schema/migrations, shared validation schemas, versioned prompts).
We required a repository architecture that supports strict dependency boundaries, rapid local development, shared TypeScript types without manual publishing steps, and deterministic CI caching.

## Decision
We chose a **monorepo managed by pnpm workspaces and Turborepo**:
1. **pnpm**: Fast, disk-efficient package manager with strict non-flat `node_modules` preventing phantom dependencies and ensuring isolation between workspaces.
2. **Turborepo**: High-performance build system that orchestrates tasks topologically and caches artifact outputs across builds and CI runs.

## Consequences
### Positive:
- End-to-end type safety: Zod schemas and TypeScript types in `packages/shared` are consumed directly by `apps/web`, `apps/api`, and `apps/worker` without an npm publish step.
- Single atomic commits across backend, frontend, and schema changes.
- Topological task execution: Turborepo automatically builds dependencies before dependents.

### Negative:
- Slightly steeper learning curve for developers unfamiliar with pnpm workspace protocols (`workspace:*`).
- Tooling configs (ESLint, TSConfig, Prettier) require centralized shared packages.

