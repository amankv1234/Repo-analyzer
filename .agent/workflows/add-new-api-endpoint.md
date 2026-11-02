# Workflow: Add a New API Endpoint

Follow these numbered steps sequentially when adding or modifying an HTTP endpoint in RepoMentor.

---

## Step 1: Define DTOs & Validation Schemas in `packages/shared`
1. Navigate to `packages/shared/src/schemas/`.
2. Define Zod schemas for the request parameters, query string, body, and successful/error responses:
   ```typescript
   export const GetRepoParamsSchema = z.object({
     id: z.string().uuid(),
   });
   export const RepoResponseSchema = z.object({
     id: z.string().uuid(),
     url: z.string().url(),
     status: z.enum(["queued", "cloning", "parsing", "indexing", "ready", "failed"]),
   });
   ```
3. Export inferred TypeScript types in `packages/shared/src/types/`.

---

## Step 2: Implement Domain Service Method in `packages/core`
1. Open the relevant domain service (e.g., `packages/core/src/ingestion/`).
2. Add a business logic method that interacts with repository interfaces.
3. Add unit tests for the domain method in `packages/core/src/.../*.spec.ts`.

---

## Step 3: Register Fastify Route Handler in `apps/api`
1. Open or create route module in `apps/api/src/routes/v1/`.
2. Use `fastify-type-provider-zod` to bind the route schema:
   ```typescript
   fastify.get(
     "/:id",
     {
       schema: {
         summary: "Get repository details by ID",
         tags: ["Repositories"],
         params: GetRepoParamsSchema,
         response: {
           200: RepoResponseSchema,
           404: ErrorResponseSchema,
         },
       },
     },
     async (request, reply) => {
       const repo = await fastify.repoService.getById(request.params.id);
       return reply.status(200).send(repo);
     }
   );
   ```
3. Ensure custom `AppError` exceptions are thrown for non-happy paths (e.g., `throw new NotFoundError("Repo not found")`).

---

## Step 4: Write Integration Tests
1. Create or update test file in `apps/api/tests/routes/`.
2. Test valid requests, invalid payloads (triggering 400 validation error), and not found states (404) using `fastify.inject()`.

---

## Step 5: Verify OpenAPI Spec & Build
1. Run `pnpm --filter @repomentor/api build`.
2. Run `pnpm --filter @repomentor/api test`.
3. Start the dev server and verify Swagger UI documentation at `http://localhost:4000/docs`.

