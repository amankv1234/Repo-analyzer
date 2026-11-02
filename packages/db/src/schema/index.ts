import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  bigint,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { vector, tsvector } from "./custom-types";

// ==============================================================================
// 1. Users Table
// ==============================================================================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  githubId: varchar("github_id", { length: 100 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==============================================================================
// 2. Repositories Table
// ==============================================================================
export const repositories = pgTable(
  "repositories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    url: text("url").notNull().unique(),
    owner: varchar("owner", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    defaultBranch: varchar("default_branch", { length: 100 }).notNull().default("main"),
    lastIndexedCommit: varchar("last_indexed_commit", { length: 40 }),
    status: varchar("status", { length: 50 }).notNull().default("queued"),
    size: bigint("size", { mode: "number" }),
    languages: jsonb("languages").$type<Record<string, number>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ownerNameIdx: index("repositories_owner_name_idx").on(table.owner, table.name),
    statusIdx: index("repositories_status_idx").on(table.status),
  })
);

// ==============================================================================
// 3. Repo Files Table
// ==============================================================================
export const repoFiles = pgTable(
  "repo_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    repoId: uuid("repo_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    language: varchar("language", { length: 50 }).notNull(),
    hash: varchar("hash", { length: 64 }).notNull(),
    size: integer("size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    repoPathIdx: index("repo_files_repo_path_idx").on(table.repoId, table.path),
  })
);

// ==============================================================================
// 4. Code Chunks Table (with pgvector HNSW & tsvector GIN indexes)
// ==============================================================================
export const codeChunks = pgTable(
  "code_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    repoId: uuid("repo_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => repoFiles.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    startLine: integer("start_line").notNull(),
    endLine: integer("end_line").notNull(),
    symbolName: varchar("symbol_name", { length: 255 }),
    symbolType: varchar("symbol_type", { length: 50 }),
    embedding: vector("embedding"),
    tsv: tsvector("tsv"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    repoFileIdx: index("code_chunks_repo_file_idx").on(table.repoId, table.fileId),
    symbolNameIdx: index("code_chunks_symbol_name_idx").on(table.symbolName),
    embeddingHnswIdx: index("code_chunks_embedding_hnsw_idx").using(
      "hnsw",
      sql`${table.embedding} vector_cosine_ops`
    ),
    tsvGinIdx: index("code_chunks_tsv_gin_idx").using("gin", table.tsv),
  })
);

// ==============================================================================
// 5. Repo Overviews Table (Contributor Onboarding Report)
// ==============================================================================
export const repoOverviews = pgTable(
  "repo_overviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    repoId: uuid("repo_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    sections: jsonb("sections").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    repoVersionIdx: index("repo_overviews_repo_version_idx").on(table.repoId, table.version),
  })
);

// ==============================================================================
// 6. Conversations Table
// ==============================================================================
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    repoId: uuid("repo_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull().default("New Conversation"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userRepoIdx: index("conversations_user_repo_idx").on(table.userId, table.repoId),
  })
);

// ==============================================================================
// 7. Messages Table
// ==============================================================================
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(),
    content: text("content").notNull(),
    citations: jsonb("citations").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    conversationIdx: index("messages_conversation_idx").on(table.conversationId),
  })
);

// ==============================================================================
// 8. Memory Records Table (3-Tier Hierarchical Memory)
// ==============================================================================
export const memoryRecords = pgTable(
  "memory_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    repoId: uuid("repo_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // 'short_term' | 'repo_state' | 'long_term_summary' | 'preference'
    summary: text("summary").notNull(),
    embedding: vector("embedding"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userRepoTypeIdx: index("memory_records_user_repo_type_idx").on(
      table.userId,
      table.repoId,
      table.type
    ),
  })
);

// ==============================================================================
// 9. Indexing Jobs Table (BullMQ background tracking)
// ==============================================================================
export const indexingJobs = pgTable(
  "indexing_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    repoId: uuid("repo_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    progress: integer("progress").notNull().default(0),
    currentStep: varchar("current_step", { length: 100 }),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    repoStatusIdx: index("indexing_jobs_repo_status_idx").on(table.repoId, table.status),
  })
);

// ==============================================================================
// Relations Definitions
// ==============================================================================
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  memoryRecords: many(memoryRecords),
}));

export const repositoriesRelations = relations(repositories, ({ many }) => ({
  files: many(repoFiles),
  chunks: many(codeChunks),
  overviews: many(repoOverviews),
  conversations: many(conversations),
  memoryRecords: many(memoryRecords),
  jobs: many(indexingJobs),
}));

export const repoFilesRelations = relations(repoFiles, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [repoFiles.repoId],
    references: [repositories.id],
  }),
  chunks: many(codeChunks),
}));

export const codeChunksRelations = relations(codeChunks, ({ one }) => ({
  repository: one(repositories, {
    fields: [codeChunks.repoId],
    references: [repositories.id],
  }),
  file: one(repoFiles, {
    fields: [codeChunks.fileId],
    references: [repoFiles.id],
  }),
}));

export const repoOverviewsRelations = relations(repoOverviews, ({ one }) => ({
  repository: one(repositories, {
    fields: [repoOverviews.repoId],
    references: [repositories.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  repository: one(repositories, {
    fields: [conversations.repoId],
    references: [repositories.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const memoryRecordsRelations = relations(memoryRecords, ({ one }) => ({
  user: one(users, {
    fields: [memoryRecords.userId],
    references: [users.id],
  }),
  repository: one(repositories, {
    fields: [memoryRecords.repoId],
    references: [repositories.id],
  }),
}));

export const indexingJobsRelations = relations(indexingJobs, ({ one }) => ({
  repository: one(repositories, {
    fields: [indexingJobs.repoId],
    references: [repositories.id],
  }),
}));

// Export inferred types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;

export type RepoFile = typeof repoFiles.$inferSelect;
export type NewRepoFile = typeof repoFiles.$inferInsert;

export type CodeChunk = typeof codeChunks.$inferSelect;
export type NewCodeChunk = typeof codeChunks.$inferInsert;

export type RepoOverview = typeof repoOverviews.$inferSelect;
export type NewRepoOverview = typeof repoOverviews.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type MemoryRecord = typeof memoryRecords.$inferSelect;
export type NewMemoryRecord = typeof memoryRecords.$inferInsert;

export type IndexingJob = typeof indexingJobs.$inferSelect;
export type NewIndexingJob = typeof indexingJobs.$inferInsert;

