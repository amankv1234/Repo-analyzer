import { eq, desc, and, sql } from "drizzle-orm";
import { db, Database } from "../client";
import {
  users,
  repositories,
  repoFiles,
  codeChunks,
  repoOverviews,
  conversations,
  messages,
  memoryRecords,
  indexingJobs,
  NewRepository,
  NewRepoFile,
  NewCodeChunk,
  NewRepoOverview,
  NewConversation,
  NewMessage,
  NewMemoryRecord,
  NewIndexingJob,
} from "../schema";

export class UserRepository {
  constructor(private readonly d: Database = db) {}

  async findById(id: string) {
    return (await this.d.select().from(users).where(eq(users.id, id)).limit(1))[0] ?? null;
  }

  async findByEmail(email: string) {
    return (await this.d.select().from(users).where(eq(users.email, email)).limit(1))[0] ?? null;
  }

  async findOrCreate(email: string, name?: string) {
    const existing = await this.findByEmail(email);
    if (existing) return existing;
    const [created] = await this.d
      .insert(users)
      .values({ email, name: name || email.split("@")[0] })
      .returning();
    return created!;
  }
}

export class RepoRepository {
  constructor(private readonly d: Database = db) {}

  async listAll(limit = 50) {
    return this.d.select().from(repositories).orderBy(desc(repositories.createdAt)).limit(limit);
  }

  async findById(id: string) {
    return (await this.d.select().from(repositories).where(eq(repositories.id, id)).limit(1))[0] ?? null;
  }

  async findByUrl(url: string) {
    return (await this.d.select().from(repositories).where(eq(repositories.url, url)).limit(1))[0] ?? null;
  }

  async create(data: NewRepository) {
    const [created] = await this.d.insert(repositories).values(data).returning();
    return created!;
  }

  async updateStatus(id: string, status: string, lastIndexedCommit?: string) {
    const [updated] = await this.d
      .update(repositories)
      .set({
        status,
        ...(lastIndexedCommit ? { lastIndexedCommit } : {}),
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, id))
      .returning();
    return updated!;
  }

  async delete(id: string) {
    const [deleted] = await this.d.delete(repositories).where(eq(repositories.id, id)).returning();
    return deleted ?? null;
  }
}

export class ChunkRepository {
  constructor(private readonly d: Database = db) {}

  async insertFiles(files: NewRepoFile[]) {
    if (files.length === 0) return [];
    return this.d.insert(repoFiles).values(files).returning();
  }

  async listFilesByRepo(repoId: string) {
    return this.d.select().from(repoFiles).where(eq(repoFiles.repoId, repoId));
  }

  async findFileById(fileId: string) {
    return (await this.d.select().from(repoFiles).where(eq(repoFiles.id, fileId)).limit(1))[0] ?? null;
  }

  async insertChunks(chunks: NewCodeChunk[]) {
    if (chunks.length === 0) return [];
    return this.d.insert(codeChunks).values(chunks).returning();
  }

  async findChunksByRepo(repoId: string, limit: number = 50) {
    return this.d
      .select()
      .from(codeChunks)
      .where(eq(codeChunks.repoId, repoId))
      .limit(limit);
  }

  async searchVector(repoId: string, embedding: number[], limit = 25) {
    try {
      const vectorStr = `[${embedding.join(",")}]`;
      const result = await this.d.execute(sql`
        SELECT 
          c.id,
          c.repo_id AS "repoId",
          c.file_id AS "fileId",
          f.path AS "filePath",
          c.start_line AS "startLine",
          c.end_line AS "endLine",
          c.symbol_name AS "symbolName",
          c.symbol_type AS "symbolType",
          c.content,
          (c.embedding <=> ${vectorStr}::vector) AS distance
        FROM code_chunks c
        JOIN repo_files f ON c.file_id = f.id
        WHERE c.repo_id = ${repoId}::uuid
          AND c.embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT ${limit};
      `);

      return (result.rows as any[]).map((row, idx) => ({
        id: row.id,
        rank: idx + 1,
        chunk: {
          id: row.id,
          repoId: row.repoId,
          fileId: row.fileId,
          filePath: row.filePath,
          startLine: row.startLine,
          endLine: row.endLine,
          symbolName: row.symbolName,
          symbolType: row.symbolType,
          content: row.content,
          score: 1 / (1 + Number(row.distance || 0)),
        },
      }));
    } catch {
      return [];
    }
  }

  async searchFullText(repoId: string, queryText: string, limit = 25) {
    try {
      const sanitized = queryText.replace(/['":|&!]/g, " ").trim();
      const result = await this.d.execute(sql`
        SELECT 
          c.id,
          c.repo_id AS "repoId",
          c.file_id AS "fileId",
          f.path AS "filePath",
          c.start_line AS "startLine",
          c.end_line AS "endLine",
          c.symbol_name AS "symbolName",
          c.symbol_type AS "symbolType",
          c.content,
          ts_rank_cd(to_tsvector('english', c.content), plainto_tsquery('english', ${sanitized})) AS rank_score
        FROM code_chunks c
        JOIN repo_files f ON c.file_id = f.id
        WHERE c.repo_id = ${repoId}::uuid
          AND to_tsvector('english', c.content) @@ plainto_tsquery('english', ${sanitized})
        ORDER BY rank_score DESC
        LIMIT ${limit};
      `);

      return (result.rows as any[]).map((row, idx) => ({
        id: row.id,
        rank: idx + 1,
        chunk: {
          id: row.id,
          repoId: row.repoId,
          fileId: row.fileId,
          filePath: row.filePath,
          startLine: row.startLine,
          endLine: row.endLine,
          symbolName: row.symbolName,
          symbolType: row.symbolType,
          content: row.content,
          score: Number(row.rank_score || 0),
        },
      }));
    } catch {
      return [];
    }
  }
}

export class OverviewRepository {
  constructor(private readonly d: Database = db) {}

  async findLatestByRepo(repoId: string) {
    return (
      (
        await this.d
          .select()
          .from(repoOverviews)
          .where(eq(repoOverviews.repoId, repoId))
          .orderBy(desc(repoOverviews.version))
          .limit(1)
      )[0] ?? null
    );
  }

  async create(data: NewRepoOverview) {
    const [created] = await this.d.insert(repoOverviews).values(data).returning();
    return created!;
  }
}

export class ConversationRepository {
  constructor(private readonly d: Database = db) {}

  async createConversation(data: NewConversation) {
    const [created] = await this.d.insert(conversations).values(data).returning();
    return created!;
  }

  async findById(id: string) {
    return (await this.d.select().from(conversations).where(eq(conversations.id, id)).limit(1))[0] ?? null;
  }

  async listByRepo(repoId: string) {
    return this.d.select().from(conversations).where(eq(conversations.repoId, repoId)).orderBy(desc(conversations.updatedAt));
  }

  async addMessage(data: NewMessage) {
    const [created] = await this.d.insert(messages).values(data).returning();
    return created!;
  }

  async getRecentMessages(conversationId: string, limit: number = 10) {
    return this.d
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }
}

export class MemoryRepository {
  constructor(private readonly d: Database = db) {}

  async listByRepo(repoId: string, userId?: string | null) {
    if (userId) {
      return this.d
        .select()
        .from(memoryRecords)
        .where(and(eq(memoryRecords.repoId, repoId), eq(memoryRecords.userId, userId)))
        .orderBy(desc(memoryRecords.updatedAt));
    }
    return this.d
      .select()
      .from(memoryRecords)
      .where(eq(memoryRecords.repoId, repoId))
      .orderBy(desc(memoryRecords.updatedAt));
  }

  async findById(id: string) {
    return (await this.d.select().from(memoryRecords).where(eq(memoryRecords.id, id)).limit(1))[0] ?? null;
  }

  async findLatestMemory(userId: string, repoId: string) {
    return (
      (
        await this.d
          .select()
          .from(memoryRecords)
          .where(
            and(
              eq(memoryRecords.userId, userId),
              eq(memoryRecords.repoId, repoId),
              eq(memoryRecords.type, "long_term_summary")
            )
          )
          .orderBy(desc(memoryRecords.updatedAt))
          .limit(1)
      )[0] ?? null
    );
  }

  async upsertMemory(data: NewMemoryRecord) {
    const [created] = await this.d.insert(memoryRecords).values(data).returning();
    return created!;
  }

  async update(id: string, summary: string) {
    const [updated] = await this.d
      .update(memoryRecords)
      .set({ summary, updatedAt: new Date() })
      .where(eq(memoryRecords.id, id))
      .returning();
    return updated ?? null;
  }

  async delete(id: string) {
    const [deleted] = await this.d.delete(memoryRecords).where(eq(memoryRecords.id, id)).returning();
    return deleted ?? null;
  }
}

export class JobRepository {
  constructor(private readonly d: Database = db) {}

  async create(data: NewIndexingJob) {
    const [created] = await this.d.insert(indexingJobs).values(data).returning();
    return created!;
  }

  async findById(id: string) {
    return (await this.d.select().from(indexingJobs).where(eq(indexingJobs.id, id)).limit(1))[0] ?? null;
  }

  async findLatestByRepo(repoId: string) {
    return (
      (
        await this.d
          .select()
          .from(indexingJobs)
          .where(eq(indexingJobs.repoId, repoId))
          .orderBy(desc(indexingJobs.createdAt))
          .limit(1)
      )[0] ?? null
    );
  }

  async updateProgress(id: string, progress: number, currentStep: string) {
    const [updated] = await this.d
      .update(indexingJobs)
      .set({
        progress,
        currentStep,
        updatedAt: new Date(),
      })
      .where(eq(indexingJobs.id, id))
      .returning();
    return updated!;
  }

  async markCompleted(id: string) {
    const [updated] = await this.d
      .update(indexingJobs)
      .set({
        status: "completed",
        progress: 100,
        currentStep: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(indexingJobs.id, id))
      .returning();
    return updated!;
  }

  async markFailed(id: string, error: string) {
    const [updated] = await this.d
      .update(indexingJobs)
      .set({
        status: "failed",
        error,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(indexingJobs.id, id))
      .returning();
    return updated!;
  }
}
