# Workflow: Add a Database Migration

Follow these numbered steps sequentially when modifying the database schema in RepoMentor.

---

## Step 1: Update Schema Definitions in `packages/db`
1. Navigate to `packages/db/src/schema/`.
2. Locate the appropriate schema file (e.g., `repositories.ts`, `code-chunks.ts`) or create a new one.
3. Use Drizzle ORM column builders (`uuid()`, `text()`, `integer()`, `jsonb()`, `vector()`, `index()`).
4. Re-export the new or updated table from `packages/db/src/schema/index.ts`.

---

## Step 2: Generate Drizzle Migration SQL
1. Run the drizzle-kit migration generator from the workspace root:
   ```bash
   pnpm --filter @repomentor/db db:generate
   ```
2. Verify that a new `.sql` file was generated under `packages/db/drizzle/` (e.g., `0002_add_repo_stats.sql`).

---

## Step 3: Inspect & Audit the Migration SQL
1. Open the generated `.sql` file in `packages/db/drizzle/`.
2. Ensure:
   - Indexes use correct operators (e.g., `USING hnsw (embedding vector_cosine_ops)`).
   - Foreign key constraints include proper cascade or set null rules.
   - Default values and not-null constraints are correctly applied.
   - Downward compatibility is considered if existing data is present.

---

## Step 4: Apply Migration Locally
1. Ensure PostgreSQL is running (`pnpm docker:up` or local Docker).
2. Apply the migration:
   ```bash
   pnpm --filter @repomentor/db db:migrate
   ```
3. Verify that the table and indices were created in Postgres using `psql` or Drizzle Studio (`pnpm --filter @repomentor/db db:studio`).

---

## Step 5: Update Repositories & Tests
1. Update Data Access Objects in `packages/db/src/repositories/` to reflect new columns or tables.
2. Run database integration tests:
   ```bash
   pnpm --filter @repomentor/db test
   ```
3. Commit both the updated schema TypeScript files and the generated `.sql` migration together.

