# Workflow: Release Checklist

Follow these numbered steps sequentially when cutting a release of RepoMentor.

---

## Step 1: Branch & Clean State Verification
1. Ensure your local branch is updated with `origin/main`:
   ```bash
   git checkout main && git pull origin main
   ```
2. Verify clean git status (`git status`). No uncommitted changes or untracked files.

---

## Step 2: Quality Gates & Automated Verification
1. Run the full verification workflow:
   ```bash
   pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```
2. Check that GitHub Actions CI pipeline on `main` is completely green.

---

## Step 3: Database Migration Status Audit
1. Run migration status check:
   ```bash
   pnpm --filter @repomentor/db db:migrate:status
   ```
2. Confirm there are no unapplied migrations or schema drifts.
3. Test a clean rollback and re-apply cycle on staging database.

---

## Step 4: Docker Container Image Build
1. Build production Docker images for API, Worker, and Web:
   ```bash
   docker build -f apps/api/Dockerfile -t repomentor-api:latest .
   docker build -f apps/worker/Dockerfile -t repomentor-worker:latest .
   docker build -f apps/web/Dockerfile -t repomentor-web:latest .
   ```
2. Verify images start and pass health check probes (`/health`).

---

## Step 5: Version Bump & Release Tagging
1. Update version numbers in `package.json` according to SemVer (e.g., `v0.1.0`).
2. Generate changelog using Conventional Commits.
3. Commit and tag:
   ```bash
   git commit -am "chore(release): v0.1.0"
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin main --tags
   ```
4. Verify deployment in staging/production environment.

