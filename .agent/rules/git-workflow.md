# Rule: Git Workflow & Release Engineering Standards

## Scope
Universal across repository development.

---

## 1. Branch Strategy

- `main`: Protected production branch. All code must pass CI before merging via Pull Request.
- `feat/<feature-name>`: Feature branches (e.g., `feat/web-tree-sitter-parser`).
- `fix/<issue-name>`: Bug fixes (e.g., `fix/pgvector-hnsw-index-nulls`).
- `docs/<doc-name>`: Documentation updates.

---

## 2. Commit Message Standard (Conventional Commits)

Format: `<type>(<scope>): <subject>`

- Allowed types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `ci`.
- Scope corresponds to workspace packages or apps: `(api)`, `(web)`, `(worker)`, `(core)`, `(db)`, `(shared)`, `(prompts)`, `(infra)`.
- Imperative, present tense, lowercase: "add support for rust parsing", NOT "Added support...".

---

## 3. Pull Request Requirements

Every pull request must:
1. Reference an existing issue or task identifier.
2. Fill out the full `.github/PULL_REQUEST_TEMPLATE.md`.
3. Contain passing CI checks (Lint, Typecheck, Unit Tests).
4. Include schema migration files if database tables were altered.
5. Not introduce new dependencies without an explanation and license audit.

---

## 4. Pre-Commit Hooks (Husky + lint-staged)

Husky runs on every local `git commit`:
- `lint-staged`: Runs `eslint --fix` and `prettier --write` on staged files.
- Fails the commit if lint errors remain.

