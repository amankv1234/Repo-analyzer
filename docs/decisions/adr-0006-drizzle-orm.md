# ADR-0006: Selection of Drizzle ORM over Prisma

## Status
Accepted

## Context
RepoMentor requires a modern TypeScript ORM with:
1. Native support for PostgreSQL extensions, specifically `pgvector` (`vector` column types and HNSW indexing).
2. Native support for PostgreSQL full-text search (`tsvector` and `GIN` indexes).
3. Minimal runtime overhead and zero dependency on native Rust query engine binaries that complicate Docker and serverless packaging.
4. Deterministic, type-safe migrations.

## Decision
We selected **Drizzle ORM** with `drizzle-kit` instead of Prisma.

## Comparison & Rationale:
- **pgvector & HNSW Support**: Drizzle has native first-class support for `pgvector` types and custom SQL operators (`<=>`, `<->`, `<#>`) and custom HNSW index syntax. Prisma has limited and historically fragile support for vector types and HNSW parameters.
- **Runtime Footprint**: Drizzle compiles down to pure lightweight JavaScript SQL query strings without an intermediate Rust query engine binary.
- **SQL Clarity**: Drizzle matches SQL semantics closely (`db.select().from().where()`), preventing unexpected N+1 queries and giving developers fine-grained control over joins and subqueries.
- **Migrations**: `drizzle-kit` generates clean, transparent SQL files that can be audited and versioned cleanly.

## Consequences
### Positive:
- Seamless integration with `pgvector` and HNSW / GIN indexing.
- Extremely low memory and CPU overhead in API and worker processes.
- Full type safety inferred directly from schema definitions.

### Negative:
- Prisma's documentation and GUI ecosystem (Prisma Studio) are slightly more mature, though Drizzle Studio and drizzle-kit provide equivalent capabilities.

