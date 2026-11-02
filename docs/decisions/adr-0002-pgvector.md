# ADR-0002: Unified Persistence with PostgreSQL 16 and pgvector

## Status
Accepted

## Context
Codebase onboarding and RAG require storing both structured relational data (users, repositories, files, conversation turns, jobs) and high-dimensional semantic vector embeddings (1536-dimensional vectors for code chunks and memory records).
We evaluated dedicated vector databases (Pinecone, Qdrant, Milvus, Chroma) versus an integrated vector extension in PostgreSQL (`pgvector`).

## Decision
We chose **PostgreSQL 16 with the `pgvector` extension** as our unified data store.
We use the **HNSW (Hierarchical Navigable Small World)** index for approximate nearest neighbor vector similarity search (`vector_cosine_ops`), alongside **GIN** indexes for PostgreSQL full-text search (`tsvector`).

## Consequences
### Positive:
- **ACID Transactions**: Relational metadata, file records, and code embeddings are created or deleted atomically within a single transaction.
- **Single Infrastructure Component**: Developers and CI need only one database service to run locally (via Docker), eliminating operational overhead and sync lag between a relational DB and a separate vector DB.
- **Single-Query Hybrid Retrieval**: Vector similarity ($L_2$ or Cosine) and keyword filtering or ranking can be combined in a single SQL query.

### Negative:
- Extremely high-scale vector collections (e.g., billions of vectors) may require manual sharding or scaling with Citus/pgvector compared to distributed native vector engines. For our target workloads (up to millions of chunks per organization), pgvector comfortably satisfies latency and throughput requirements.

