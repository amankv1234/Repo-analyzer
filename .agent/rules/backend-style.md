# Rule: Backend Style & Architecture Guide

## Scope
Applies to `apps/api/`, `apps/worker/`, `packages/core/`, `packages/db/`, and `packages/shared/`.

---

## 1. Layered Architecture & Separation of Concerns

All backend code follows a unidirectional dependency flow:
```
Routes / Controllers (apps/api/src/routes)
         │
         ▼
Domain Services (packages/core)
         │
         ▼
Repositories (packages/db/repositories)
         │
         ▼
Database / External APIs (PostgreSQL / Redis / Claude)
```

### Constraints:
1. **Route Handlers (`apps/api`)**:
   - Must only handle HTTP request parsing, Zod schema validation, response formatting, and status codes.
   - Must **never** execute SQL queries or instantiate external SDKs directly.
   - Must delegate business logic to domain services.

2. **Domain Services (`packages/core`)**:
   - Must be 100% framework-independent (no `@fastify/*` or `express` types).
   - Consume repository interfaces, not raw database clients.
   - Return plain TypeScript objects, never framework-specific responses.

3. **Repositories (`packages/db`)**:
   - Encapsulate all Drizzle ORM operations, table joins, and SQL operators.
   - Expose methods such as `findById(id: string)`, `create(data: InsertRepo)`, `searchChunks(query: VectorQuery)`.
   - Never leak ORM query builders into the route layer.

---

## 2. Fastify Routing & Plugin Standards

- Register routes using modular Fastify plugins with `fastify-plugin` or auto-prefixing:
  ```typescript
  import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

  export const repoRoutes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.post(
      "/",
      {
        schema: {
          summary: "Submit repository for indexing",
          description: "Initiates asynchronous cloning and AST parsing job",
          tags: ["Repositories"],
          body: IndexRepoRequestSchema,
          response: {
            202: IndexRepoResponseSchema,
            400: ErrorResponseSchema,
          },
        },
      },
      async (request, reply) => {
        const result = await fastify.repoService.queueIndexJob(request.body.url);
        return reply.status(202).send(result);
      }
    );
  };
  ```
- Always configure request/response serialization with Zod type providers (`fastify-type-provider-zod`).
- Tag routes appropriately to automatically populate OpenAPI / Swagger schemas.

---

## 3. Worker & Queue Patterns (`apps/worker`)

- Workers must use BullMQ with Redis connection pooling.
- Jobs must be idempotent: if a worker crashes and retries a job, it must not create duplicate chunks or corrupted state.
- Workers must report granular step progress via `job.updateProgress({ step: 'parsing_ast', percent: 45 })`.
- Jobs must handle graceful shutdown: listen for `SIGTERM` and `SIGINT`, complete the active chunk/file if possible, and release locks.

---

## 4. Error Handling & RFC 7807

- Throw domain-specific errors inheriting from `AppError`:
  - `NotFoundError` (404)
  - `ValidationError` (400)
  - `UnauthorizedError` (401)
  - `ConflictError` (409)
  - `RateLimitError` (429)
  - `InternalServerError` (500)
- The global Fastify error handler maps `AppError` to RFC 7807 Problem Details JSON format:
  ```json
  {
    "type": "https://repomentor.dev/errors/REPO_NOT_FOUND",
    "title": "Repository Not Found",
    "status": 404,
    "detail": "Repository with ID '123e4567-e89b-12d3-a456-426614174000' does not exist.",
    "instance": "/api/v1/repos/123e4567-e89b-12d3-a456-426614174000",
    "reqId": "req-98af31"
  }
  ```

---

## 5. Logging Standards

- Use structured JSON logging via Pino.
- Always include `reqId` in logs originating from HTTP handlers.
- Never log sensitive tokens, user passwords, or raw user prompts containing confidential PII.
- Log levels:
  - `debug`: Detailed loop iterations, AST node metrics, cache hit/miss details.
  - `info`: Server startup, job status changes, successful report generations.
  - `warn`: Recoverable errors, rate limit throttles, fallback provider triggers.
  - `error`: Uncaught exceptions, failed DB transactions, fatal worker job crashes.

