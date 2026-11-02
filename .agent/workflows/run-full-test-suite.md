# Workflow: Run Full Test Suite & Quality Verification

Follow these numbered steps sequentially before pushing code or opening pull requests.

---

## Step 1: Ensure Prerequisites & Background Services
1. Ensure Docker daemon is running.
2. Spin up test infrastructure:
   ```bash
   pnpm docker:up
   ```
3. Verify Postgres and Redis containers are healthy (`docker ps`).

---

## Step 2: Code Formatting & Linting Check
1. Run Prettier style validation:
   ```bash
   pnpm format:check
   ```
   If formatting errors exist, run `pnpm format` to auto-fix.
2. Run ESLint across all workspaces:
   ```bash
   pnpm lint
   ```
   Resolve any warnings or errors. Ensure zero `@typescript-eslint/no-explicit-any` violations.

---

## Step 3: TypeScript Monorepo Typecheck
1. Run strict TypeScript compiler verification across all packages and apps:
   ```bash
   pnpm typecheck
   ```
2. Ensure 0 compiler diagnostics are emitted.

---

## Step 4: Execute Unit & Integration Test Suites
1. Run the Vitest test runner across all workspaces:
   ```bash
   pnpm test
   ```
2. Verify all test suites pass with 100% success rate.
3. If running coverage checks:
   ```bash
   pnpm test:coverage
   ```
   Confirm coverage meets the 80% line coverage threshold for `@repomentor/core` and `@repomentor/shared`.

---

## Step 5: Full Monorepo Build Check
1. Execute Turborepo build pipeline:
   ```bash
   pnpm build
   ```
2. Ensure Next.js web application, Fastify API bundle, Worker daemon, and all packages compile cleanly to `dist/` or `.next/`.

