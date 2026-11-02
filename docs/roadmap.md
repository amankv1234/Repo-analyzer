# Product & Technical Roadmap - RepoMentor

---

## 1. Roadmap Overview & Philosophy

RepoMentor follows a **Now / Next / Later** progression model. Every item corresponds to real architectural goals and community contribution opportunities.

```text
  [ NOW (v0.3.x Stability & DX) ]  ──►  [ NEXT (v0.4.x Advanced RAG) ]  ──►  [ LATER (v1.0 Enterprise) ]
```

---

## 2. NOW (Active Milestone — v0.3.x Stability & DX)

Focus: Refinement, test coverage, multi-model support, and exceptional contributor experience.

- [x] **Universal Provider Abstraction**: Free Google Gemini Flash REST provider + Claude 3.5 Sonnet + Offline Mock mode.
- [x] **Zero-Key Local Dev Experience**: `pnpm doctor` healthcheck and `pnpm seed:mock` fixture seeding.
- [x] **7-Language AST Symbol Chunking**: TypeScript, JavaScript, Python, Go, Rust, Java, C/C++ via WASM.
- [x] **Next.js 14 Responsive UI**: Real-time SSE stage tracker, tabbed dashboard, slide-in code drawer.
- [x] **Export Formats**: Full GitHub Flavored Markdown and `CONTRIBUTING.md` generation.
- [ ] **Accessibility & Keyboard Navigation**: Full WCAG 2.1 AA keyboard navigation across all dashboard tabs (`1-4`).
- [ ] **Syntax Highlighting in Code Drawer**: Integrate Prism/Shiki light/dark token rendering in code viewer.
- [ ] **Multi-turn Memory Deduplication**: Semantic deduplication in `MemorySummarizer`.
- [ ] **Interactive Mermaid Zoom & Pan**: SVG pan/zoom controls for architecture diagrams.

---

## 3. NEXT (Next Milestone — v0.4.x Advanced Intelligence)

Focus: Call-graph analysis, private repository support, and enhanced retrieval.

- [ ] **Symbol Call-Graph Navigation**: Visual interactive dependency graph showing caller/callee relationships between functions.
- [ ] **Private GitHub App OAuth**: Encrypted token storage allowing access to private organizational repositories.
- [ ] **C# & Ruby Tree-Sitter Parsers**: Add WASM grammars for C# and Ruby.
- [ ] **Public Read-Only Share Links**: Revocable public share URLs for indexed onboarding guides.
- [ ] **Multi-Repo Comparison Mode**: Side-by-side architectural diff of two repositories.
- [ ] **Onboarding Interactive Quiz**: Knowledge check generating memory reinforcement questions.

---

## 4. LATER (Future Horizon — v1.0 Enterprise & Cloud Scale)

Focus: Enterprise scalability, IDE sidecars, and team memory.

- [ ] **Multi-Branch Diff Indexing**: Instant incremental re-indexing triggered by GitHub webhooks without re-cloning.
- [ ] **Organization-Wide Shared Memory**: Team-level institutional knowledge base shared across an engineering org.
- [ ] **VS Code & Cursor Extension**: Native editor sidecar streaming line citations directly into the active editor.
- [ ] **Air-Gapped On-Premises Deployment**: Self-hosted Ollama/vLLM inference and Qdrant vector backend.
- [ ] **GitHub Action PR Bot**: Automated bot posting tailored onboarding guides into newcomer pull requests.
