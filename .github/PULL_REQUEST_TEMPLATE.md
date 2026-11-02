## Description
<!-- Provide a concise summary of the changes made and the motivation behind them. -->

Fixes #(issue)

## Type of Change
<!-- Mark with an [x] -->
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] 💡 New feature (non-breaking change adding functionality)
- [ ] ⚡ Performance improvement
- [ ] 📚 Documentation update
- [ ] 🧹 Refactoring / Code hygiene
- [ ] 🧪 Tests / Evals update

## Quality Checklist
<!-- Verify each before requesting review -->
- [ ] My code strictly adheres to the architecture layers in `AGENTS.md` and `.agent/rules/`.
- [ ] I have executed `pnpm typecheck` with zero diagnostic errors.
- [ ] I have executed `pnpm test` and all unit/integration suites pass.
- [ ] I have executed `pnpm lint && pnpm format:check` without errors.
- [ ] Any new HTTP endpoints or payloads are validated with Zod schemas.
- [ ] If changing database schema, I included a forward Drizzle migration.
- [ ] For UI changes, I included a screenshot or screen recording below.
- [ ] I have reviewed the code myself and verified no secrets/keys are committed.

## Screenshots / Verification Evidence
<!-- If applicable, attach screenshots or terminal output here -->
