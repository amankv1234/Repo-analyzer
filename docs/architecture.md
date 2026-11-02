# System Architecture - RepoMentor

---

## 1. System Overview

RepoMentor is engineered as an event-driven, decoupled system composed of a modern reactive frontend, a high-throughput HTTP API, a distributed asynchronous background worker cluster, and a unified storage engine powered by PostgreSQL 16 with the `pgvector` extension and Redis.

### Architectural Tenets:
1. **Asynchronous Ingestion**: Repository ingestion is fundamentally long-running (cloning, AST parsing, embedding, synthesizing reports). It is decoupled from the HTTP cycle via BullMQ queues.
2. **Layer Inversion & Framework Agnosticism**: Core domain models, retrieval math, AST parsers, and prompt definitions reside in pure TypeScript packages independent of web frameworks.
3. **Defense-in-Depth**: Cloned code is treated as malicious input. AST parsing runs inside sandboxed WebAssembly runtimes (`web-tree-sitter`).
4. **Hybrid Code Retrieval**: Code search merges dense semantic embeddings with sparse full-text keyword indices using Reciprocal Rank Fusion (RRF).

---

## 2. High-Level Component Diagram

```mermaid
flowchart TB
    subgraph Client["Client Tier (Browser)"]
        Web["apps/web (Next.js App Router)"]
        UIComp["Tailwind CSS + shadcn/ui"]
        TanStack["TanStack Query (v5)"]
    end

    subgraph Gateway["API Gateway Tier"]
        API["apps/api (Fastify HTTP)"]
        Swagger["@fastify/swagger (OpenAPI 3.1)"]
        AuthMiddleware["Auth & Rate Limiting"]
        PinoLogger["Pino Structured Logger"]
    end

    subgraph AsyncTier["Async Processing Tier"]
        Worker["apps/worker (BullMQ Daemon)"]
        Queue["Redis 7 (BullMQ Queue: repo-indexing)"]
    end

    subgraph DomainCore["Domain Packages"]
        Core["packages/core (Domain Logic)"]
        Parser["AST Parser (web-tree-sitter WASM)"]
        Embedder["Embedding Engine (Voyage AI / Local)"]
        LLM["LLM Engine (Anthropic Claude SDK)"]
        Memory["3-Tier Memory Manager"]
        RAG["Hybrid RAG & RRF Merging"]
        Prompts["packages/prompts (Versioned Templates)"]
        Shared["packages/shared (Zod & Types)"]
    end

    subgraph StorageTier["Persistence Tier"]
        DB[(PostgreSQL 16)]
        VectorExt["pgvector Extension (HNSW Index)"]
        FTS["tsvector Full-Text Search (GIN Index)"]
        Drizzle["packages/db (Drizzle ORM)"]
    end

    subgraph ExternalServices["External Providers"]
        GitHub["GitHub API / Git Clones"]
        AnthropicAPI["Anthropic Claude API (Sonnet / Haiku)"]
        VoyageAPI["Voyage AI Embeddings API"]
    end

    Web -->|HTTP / SSE| API
    API -->|Enqueue Jobs| Queue
    Queue -->|Consume Jobs| Worker
    API -->|Read Overviews / Queries| Drizzle
    Worker -->|Execute Pipeline| Core
    Core --> Parser
    Core --> Embedder
    Core --> LLM
    Core --> Memory
    Core --> RAG
    Core --> Prompts
    Worker -->|Persist Chunks, Vectors, Overviews| Drizzle
    Drizzle --> DB
    DB --> VectorExt
    DB --> FTS
    Worker -->|Shallow Clone| GitHub
    LLM -->|API Requests| AnthropicAPI
    Embedder -->|Vector Computations| VoyageAPI
```

---

## 3. End-to-End Data Flow 1: "Index a Repository"

The sequence diagram below illustrates the complete lifecycle of indexing a repository:

```mermaid
sequenceDiagram
    autonumber
    actor User as Developer
    participant Web as apps/web
    participant API as apps/api
    participant Redis as Redis (BullMQ)
    participant Worker as apps/worker
    participant Git as GitHub / simple-git
    participant TreeSitter as Tree-Sitter (WASM)
    participant Voyage as Voyage AI / Embedder
    participant Claude as Anthropic Claude
    participant DB as Postgres (pgvector)

    User->>Web: Enter Git URL (e.g., https://github.com/org/repo)
    Web->>API: POST /api/v1/repos { url }
    API->>DB: Check if repo exists & matches cache
    API->>DB: Create repo record (status: 'queued') & indexing_job
    API->>Redis: Enqueue 'index-repo' job { repoId, url }
    API-->>Web: Return 202 Accepted { repoId, jobId }
    Web-->>User: Display Progress Dashboard (Polling / SSE)

    Redis->>Worker: Dispatch 'index-repo' job
    Worker->>DB: Update job status: 'cloning'
    Worker->>Git: Shallow clone (--depth 1) into ephemeral storage
    Git-->>Worker: Cloned files in temp directory
    Worker->>DB: Update job progress: 20%, status: 'parsing'

    Worker->>TreeSitter: Parse AST for supported source files
    TreeSitter-->>Worker: Extracted function/class AST chunks + symbols
    Worker->>DB: Insert repo_files and code_chunks (text + metadata)
    Worker->>DB: Update job progress: 50%, status: 'embedding'

    Worker->>Voyage: Batch embed code chunks (1536-dim vectors)
    Voyage-->>Worker: Vector embeddings array
    Worker->>DB: Update code_chunks with embeddings + tsvectors
    Worker->>DB: Update job progress: 75%, status: 'generating_overview'

    Worker->>Claude: Synthesize 7-section Onboarding Report
    Claude-->>Worker: Structured Onboarding JSON
    Worker->>DB: Insert repo_overviews record
    Worker->>DB: Update repo status: 'ready', job status: 'completed' (100%)
    Worker->>Worker: Clean up temp shallow clone directory
    Web->>API: GET /api/v1/repos/:id/overview
    API-->>Web: Return Onboarding Report
    Web-->>User: Render Comprehensive Onboarding Workspace
```

---

## 4. End-to-End Data Flow 2: "Ask a Question (RAG with Citations)"

```mermaid
sequenceDiagram
    autonumber
    actor User as Developer
    participant Web as apps/web
    participant API as apps/api
    participant Core as packages/core (RAG & Memory)
    participant Embedder as EmbeddingProvider
    participant DB as Postgres (pgvector)
    participant Claude as Anthropic Claude (Sonnet)

    User->>Web: Submit question: "How is database migration handled?"
    Web->>API: POST /api/v1/repos/:id/chat { conversationId, content }
    API->>Core: Execute Chat Pipeline (repoId, userId, question)

    rect rgb(240, 248, 255)
        Note over Core,DB: Layer 1 & 2: Memory Retrieval
        Core->>DB: Fetch short-term conversation turns
        Core->>DB: Fetch user-repo persistent memory summary & repo overview
    end

    rect rgb(245, 255, 245)
        Note over Core,DB: Layer 3: Hybrid Retrieval & RRF
        Core->>Embedder: Generate query embedding (1536-dim)
        Embedder-->>Core: Query vector
        par Dense Vector Search
            Core->>DB: HNSW Cosine Similarity (top 25 chunks)
        and Sparse Lexical Search
            Core->>DB: Full-Text tsquery / tsvector (top 25 chunks)
        end
        Core->>Core: Reciprocal Rank Fusion (RRF k=60) -> Top 8 chunks
    end

    Core->>Claude: Invoke Chat Prompt (Memory + Top Chunks + Question)
    Claude-->>Core: Streamed Markdown response with citations [file.ts:10-45]
    Core->>DB: Persist User Message & Assistant Message with parsed citations
    Core-->>API: Stream tokens to HTTP response
    API-->>Web: Stream SSE tokens to UI
    Web-->>User: Display streaming answer + interactive citation cards
```

---

## 5. Scalability & High Availability Architecture

1. **Horizontally Scalable Stateless Workers**:
   - Worker processes (`apps/worker`) run independently in stateless Docker containers.
   - Worker concurrency is dynamically managed through BullMQ worker pool sizing and Redis queue backlog metrics.
2. **PostgreSQL Connection Optimization**:
   - Fastify API instances and BullMQ workers connect to PostgreSQL using a connection pool configured with max connections and idle timeouts via `pg.Pool`.
3. **Rate Limiting & Cost Management**:
   - Ingestion jobs are rate-limited per user and per IP.
   - Voyage AI batch embedding requests are grouped into maximum permissible batch payloads (e.g., 128 chunks per call) to minimize network roundtrips.
4. **Storage Pruning & Ephemeral Workspace Hygiene**:
   - Git repository clones are stored strictly in temporary, auto-deleted directories (`tmp/repomentor/<job_id>`).
   - If a worker crashes mid-clone, cleanup hooks clean orphan directories on boot.

