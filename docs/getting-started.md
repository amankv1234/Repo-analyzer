# Getting Started with RepoMentor (Local Setup in <10 Minutes)

Welcome! This guide walks you through setting up and running RepoMentor locally from scratch. You can run RepoMentor with **Zero Paid Keys** using either the **Free Google Gemini API** or **100% Offline Mock Mode**.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v22.x LTS` (Check: `node -v`)
- **pnpm**: `v9.x` or `v11.x` (Check: `pnpm -v`)
- **Docker & Docker Compose**: (Check: `docker compose version`)
- **Git**

---

## 2. Clone & Environment Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/repomentor.git
cd repomentor

# 2. Copy the environment configuration template
cp .env.example .env
```

---

## 3. Choose Your LLM & Embedding Mode

Open your `.env` file and select your preferred operational mode:

### Option A: Free Google Gemini (Recommended for Free Full AI)
Google AI Studio offers a free API key with high rate limits for `gemini-1.5-flash`:
1. Get a free API key at [Google AI Studio](https://aistudio.google.com).
2. Configure `.env`:
   ```env
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=AIzaSyYourActualFreeGeminiApiKeyHere
   GEMINI_MODEL=gemini-1.5-flash
   EMBEDDING_PROVIDER=mock
   ```

### Option B: 100% Offline Mock Mode (Zero Keys, Zero External Requests)
Run everything locally with deterministic mock responses:
```env
LLM_PROVIDER=mock
EMBEDDING_PROVIDER=mock
```

### Option C: Production Enterprise (Claude 3.5 Sonnet + Voyage AI)
```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...
EMBEDDING_PROVIDER=voyage
VOYAGE_API_KEY=pa-...
```

---

## 4. One-Command Monorepo Boot

Run the following commands in the repository root:

```bash
# 1. Install all dependencies across the monorepo
pnpm install

# 2. Start PostgreSQL (with pgvector) and Redis in Docker
pnpm docker:up

# 3. Apply database migrations
pnpm --filter @repomentor/db db:migrate

# 4. Optional: Run the environment doctor to verify all services
pnpm doctor

# 5. Start development servers (Next.js web, Fastify API, BullMQ worker)
pnpm dev
```

---

## 5. Verify Running Services

Once started, the following services are live:

| Service | Local URL | Description |
| :--- | :--- | :--- |
| **Web Frontend** | [http://localhost:3000](http://localhost:3000) | Next.js App Router UI & Chat Workspace |
| **API Server** | [http://localhost:4000](http://localhost:4000) | Fastify HTTP Gateway |
| **OpenAPI Docs** | [http://localhost:4000/docs](http://localhost:4000/docs) | Interactive Swagger API Explorer |
| **API Health Probe** | [http://localhost:4000/health](http://localhost:4000/health) | Liveness Probe |
| **API Readiness Probe**| [http://localhost:4000/ready](http://localhost:4000/ready) | PostgreSQL & Redis Status Check |

---

## 6. Seed Demo Data (Optional)

To seed a pre-indexed fixture repository into your local PostgreSQL database without waiting for a full Git clone:
```bash
pnpm seed:mock
```
Then visit [http://localhost:3000](http://localhost:3000) to immediately explore the React onboarding report, streaming chat, and code citations.

---

## 7. Next Steps
- Read the [Codebase Tour (`docs/codebase-tour.md`)](file:///docs/codebase-tour.md) to understand where code lives.
- Read [Contributing Guidelines (`CONTRIBUTING.md`)](file:///CONTRIBUTING.md) to open your first pull request.

