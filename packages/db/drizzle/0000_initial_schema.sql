-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" varchar(255) UNIQUE,
    "name" varchar(255),
    "avatar_url" text,
    "github_id" varchar(100) UNIQUE,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Repositories Table
CREATE TABLE IF NOT EXISTS "repositories" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "url" text NOT NULL UNIQUE,
    "owner" varchar(255) NOT NULL,
    "name" varchar(255) NOT NULL,
    "default_branch" varchar(100) DEFAULT 'main' NOT NULL,
    "last_indexed_commit" varchar(40),
    "status" varchar(50) DEFAULT 'queued' NOT NULL,
    "size" bigint,
    "languages" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "repositories_owner_name_idx" ON "repositories" ("owner", "name");
CREATE INDEX IF NOT EXISTS "repositories_status_idx" ON "repositories" ("status");

-- 3. Repo Files Table
CREATE TABLE IF NOT EXISTS "repo_files" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "repo_id" uuid NOT NULL REFERENCES "repositories"("id") ON DELETE CASCADE,
    "path" text NOT NULL,
    "language" varchar(50) NOT NULL,
    "hash" varchar(64) NOT NULL,
    "size" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "repo_files_repo_path_idx" ON "repo_files" ("repo_id", "path");

-- 4. Code Chunks Table
CREATE TABLE IF NOT EXISTS "code_chunks" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "repo_id" uuid NOT NULL REFERENCES "repositories"("id") ON DELETE CASCADE,
    "file_id" uuid NOT NULL REFERENCES "repo_files"("id") ON DELETE CASCADE,
    "content" text NOT NULL,
    "start_line" integer NOT NULL,
    "end_line" integer NOT NULL,
    "symbol_name" varchar(255),
    "symbol_type" varchar(50),
    "embedding" vector(1536),
    "tsv" tsvector,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "code_chunks_repo_file_idx" ON "code_chunks" ("repo_id", "file_id");
CREATE INDEX IF NOT EXISTS "code_chunks_symbol_name_idx" ON "code_chunks" ("symbol_name");
CREATE INDEX IF NOT EXISTS "code_chunks_embedding_hnsw_idx" ON "code_chunks" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "code_chunks_tsv_gin_idx" ON "code_chunks" USING gin ("tsv");

-- 5. Repo Overviews Table
CREATE TABLE IF NOT EXISTS "repo_overviews" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "repo_id" uuid NOT NULL REFERENCES "repositories"("id") ON DELETE CASCADE,
    "version" integer DEFAULT 1 NOT NULL,
    "sections" jsonb NOT NULL,
    "generated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "repo_overviews_repo_version_idx" ON "repo_overviews" ("repo_id", "version");

-- 6. Conversations Table
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
    "repo_id" uuid NOT NULL REFERENCES "repositories"("id") ON DELETE CASCADE,
    "title" varchar(255) DEFAULT 'New Conversation' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "conversations_user_repo_idx" ON "conversations" ("user_id", "repo_id");

-- 7. Messages Table
CREATE TABLE IF NOT EXISTS "messages" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
    "role" varchar(20) NOT NULL,
    "content" text NOT NULL,
    "citations" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "messages_conversation_idx" ON "messages" ("conversation_id");

-- 8. Memory Records Table
CREATE TABLE IF NOT EXISTS "memory_records" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
    "repo_id" uuid NOT NULL REFERENCES "repositories"("id") ON DELETE CASCADE,
    "type" varchar(50) NOT NULL,
    "summary" text NOT NULL,
    "embedding" vector(1536),
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "memory_records_user_repo_type_idx" ON "memory_records" ("user_id", "repo_id", "type");

-- 9. Indexing Jobs Table
CREATE TABLE IF NOT EXISTS "indexing_jobs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "repo_id" uuid NOT NULL REFERENCES "repositories"("id") ON DELETE CASCADE,
    "status" varchar(50) DEFAULT 'pending' NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "current_step" varchar(100),
    "error" text,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "indexing_jobs_repo_status_idx" ON "indexing_jobs" ("repo_id", "status");

