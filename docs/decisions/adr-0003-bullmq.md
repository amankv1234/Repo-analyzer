# ADR-0003: Asynchronous Job Processing with BullMQ and Redis

## Status
Accepted

## Context
Cloning a Git repository, analyzing hundreds of source files with AST parsers, batch-generating semantic embeddings, and prompting an LLM to synthesize an extensive onboarding report takes anywhere from 10 seconds to several minutes. Performing these actions inside an HTTP request cycle would lead to socket timeouts, poor user experience, and lack of fault tolerance.

## Decision
We chose **BullMQ backed by Redis 7** to handle all repository ingestion and long-running background tasks.
The Fastify HTTP API (`apps/api`) enqueues jobs and immediately responds with a `202 Accepted` status and a `jobId`. Dedicated worker daemons (`apps/worker`) consume jobs, report progress events, and handle retries with exponential backoff.

## Consequences
### Positive:
- **Resilience**: Failed jobs can be automatically retried; crashes do not bring down the API server.
- **Granular Progress Reporting**: Workers report step-by-step progress percentages (`cloning`, `parsing`, `embedding`, `generating_overview`) directly visible to users.
- **Horizontal Scalability**: Worker instances can scale dynamically based on Redis queue depth independently of the API gateway.

### Negative:
- Introduces Redis as a required runtime infrastructure dependency alongside PostgreSQL.
- Requires managing job idempotency and cleanup of stale jobs.

