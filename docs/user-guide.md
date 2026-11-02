# End-User Guide - RepoMentor

---

## 1. Quick Start: Submitting Your First Repository

1. Open your browser to `http://localhost:3000`.
2. Paste any public GitHub repository URL into the input bar (e.g., `https://github.com/facebook/react` or `https://github.com/fastify/fastify`).
3. Click **Analyze Repo**.
4. The **Indexing Progress Tracker** will display real-time updates through 6 stages:
   - **Queued**: Job scheduled in the background BullMQ queue.
   - **Cloning**: Shallow (`--depth 1`) isolated clone executed.
   - **Analyzing**: Static analyzer parses dependencies, entry points, and test configs (zero code evaluation).
   - **Embedding**: Universal AST chunking extracts functions and classes and computes dense vector embeddings.
   - **Creating Overview**: Synthesizes the 7-section Contributor Onboarding Report.
   - **Complete**: Redirects to the interactive dashboard.

---

## 2. Navigating the Dashboard

### 2.1 Onboarding Report Tab
- **Project Purpose & Summary**: High-level problem definition and technical rationale.
- **Technology Stack**: Runtime, frameworks, and tools with explicit justifications for why they were likely chosen.
- **Architecture & Flow**: High-level control flow with interactive Mermaid diagram syntax.
- **Local Setup Guide**: Step-by-step commands with one-click copy buttons.
- **Key Files to Read First**: Ranked by read order to understand execution bootstrap quickly.
- **Export**: Export as complete GitHub Flavored Markdown (`.md`) or a standalone `CONTRIBUTING.md`.

### 2.2 RAG Code Chat Tab
- Type any technical question in natural language.
- Select the **Query Intent** for tuned responses:
  - `General Query`: Broad conceptual questions.
  - `Explain Code`: Explains specific functions or patterns.
  - `Where is X Implemented?`: Pinpoints exact files and symbols.
  - `How to Run / Setup`: Step-by-step command diagnostics.
  - `Add Feature`: Grounded enhancement recommendations.
- **Verifiable Citations**: Every code reference includes a clickable badge (e.g. `[src/index.ts:15-40]`). Clicking it opens the **Code Viewer Drawer** showing syntax-highlighted code at the exact line range with a direct link to GitHub.

### 2.3 Memory State Tab
- Inspect the assistant's 3-tier persistent memory:
  - Active feature goals
  - Comprehension state and assumptions
  - Developer preferences
- Edit any memory record inline or delete outdated records with one click.

### 2.4 Enhancement Plan Tab
- Enter a description of a feature or bug fix.
- RepoMentor performs impact analysis, identifies target files, and outputs a step-by-step plan with suggested unified diffs (`--- a/file` / `+++ b/file`).

---

## 3. Troubleshooting & Common Issues

### 3.1 Database Connection Failures (`ECONNREFUSED` or `database unavailable`)
- **Symptoms**: `/ready` returns `503 Service Unavailable`, or logs show `Failed to connect to PostgreSQL at localhost:5432`.
- **Resolution**:
  1. Ensure Docker Desktop is running: `docker info`.
  2. Start containers: `pnpm docker:up`.
  3. Run migrations: `pnpm --filter @repomentor/db db:migrate`.

### 3.2 BullMQ Worker Not Picking Up Jobs
- **Symptoms**: Repository remains indefinitely in `queued` status.
- **Resolution**:
  1. Verify Redis is running: `docker exec -it repomentor-dev-redis redis-cli ping` (expected `PONG`).
  2. Start worker: `pnpm --filter @repomentor/worker dev`.

### 3.3 Large Repositories Failing During Indexing
- **Symptoms**: Job fails with `Repository exceeds maximum clone size (100 MB)`.
- **Resolution**:
  - Adjust `MAX_REPO_SIZE_MB` in your `.env` file if you have sufficient memory (e.g. `MAX_REPO_SIZE_MB=300`).

---

## 4. Frequently Asked Questions (FAQ)

### What programming languages does RepoMentor support?
RepoMentor includes native AST symbol extractors for **TypeScript, JavaScript, Python, Go, Rust, Java, and C/C++** using WASM-compiled Tree-Sitter grammars. Documentation and configuration files (Markdown, JSON, YAML, TOML) are parsed with specialized structural splitters. All other plain text files fall back to sliding-window chunking.

### Does RepoMentor execute any code from the analyzed repository?
**Never.** RepoMentor strictly adheres to the rule: "Untrusted repositories are data, not programs." No build tools (`npm install`, `cargo build`, `python setup.py`, `make`) are ever invoked on analyzed code. Parsing is strictly static via WASM abstract syntax trees.

### How does RepoMentor prevent hallucinations in RAG responses?
1. **Hybrid Retrieval**: Merges vector similarity with exact keyword lexical search via Reciprocal Rank Fusion ($k=60$).
2. **Strict System Prompt Instructions**: Directs the LLM to output only facts grounded in the retrieved code chunks. If information is missing, the assistant states that it was not found in the code.
3. **Verifiable Line Citations**: Every claim must reference `[file:startLine-endLine]`.
4. **Validation Parser**: Any invalid citation is detected and omitted before streaming.

### What LLM models are supported?
RepoMentor supports **Google Gemini** (free `gemini-1.5-flash`), **Anthropic Claude** (`claude-3-5-sonnet` / `haiku`), and a local `mock` provider for offline test suites.
