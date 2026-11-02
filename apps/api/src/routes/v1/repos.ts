import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  IndexRepoRequestSchema,
  IndexRepoResponseSchema,
  RepoResponseSchema,
  RepoOverviewResponseSchema,
  FileNodeResponseSchema,
  FileContentResponseSchema,
  MemoryRecordSchema,
  UpdateMemoryRequestSchema,
  ErrorResponseSchema,
} from "@repomentor/shared";
import {
  RepoRepository,
  OverviewRepository,
  JobRepository,
  ChunkRepository,
  MemoryRepository,
} from "@repomentor/db";

export const repoRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const repoRepo = new RepoRepository();
  const overviewRepo = new OverviewRepository();
  const jobRepo = new JobRepository();
  const chunkRepo = new ChunkRepository();
  const memoryRepo = new MemoryRepository();

  // POST /api/v1/repos - Submit repository
  fastify.post(
    "/",
    {
      schema: {
        summary: "Submit repository for onboarding analysis",
        tags: ["Repositories"],
        body: IndexRepoRequestSchema,
        response: {
          202: IndexRepoResponseSchema,
          400: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { url, branch } = request.body;

      let repo = await repoRepo.findByUrl(url);
      if (!repo) {
        const parsedUrl = new URL(url);
        const parts = parsedUrl.pathname.replace(/^\/|\.git$/g, "").split("/");
        const owner = parts[0] || "unknown";
        const name = parts[1] || "unknown";

        repo = await repoRepo.create({
          url,
          owner,
          name,
          defaultBranch: branch || "main",
          status: "queued",
          languages: {},
        });
      }

      const job = await jobRepo.create({
        repoId: repo.id,
        status: "pending",
        progress: 0,
        currentStep: "queued",
      });

      return reply.status(202).send({
        repoId: repo.id,
        jobId: job.id,
        status: "queued",
        message: "Repository queued for indexing. Track progress via /api/v1/jobs/:id or /api/v1/repos/:id/status",
      });
    }
  );

  // GET /api/v1/repos - List all repositories
  fastify.get(
    "/",
    {
      schema: {
        summary: "List all indexed repositories",
        tags: ["Repositories"],
        response: {
          200: z.array(RepoResponseSchema),
        },
      },
    },
    async (_request, reply) => {
      const repos = await repoRepo.listAll();
      return reply.status(200).send(
        repos.map((r) => ({
          id: r.id,
          url: r.url,
          owner: r.owner,
          name: r.name,
          defaultBranch: r.defaultBranch,
          lastIndexedCommit: r.lastIndexedCommit,
          status: r.status as any,
          size: r.size,
          languages: r.languages,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }))
      );
    }
  );

  // GET /api/v1/repos/:id - Get details
  fastify.get(
    "/:id",
    {
      schema: {
        summary: "Get repository details",
        tags: ["Repositories"],
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: RepoResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const repo = await repoRepo.findById(request.params.id);
      if (!repo) {
        return reply.status(404).send({
          title: "Repository Not Found",
          status: 404,
          detail: `Repository '${request.params.id}' was not found.`,
        });
      }

      return reply.status(200).send({
        id: repo.id,
        url: repo.url,
        owner: repo.owner,
        name: repo.name,
        defaultBranch: repo.defaultBranch,
        lastIndexedCommit: repo.lastIndexedCommit,
        status: repo.status as any,
        size: repo.size,
        languages: repo.languages,
        createdAt: repo.createdAt.toISOString(),
        updatedAt: repo.updatedAt.toISOString(),
      });
    }
  );

  // GET /api/v1/repos/:id/overview - Get onboarding report
  fastify.get(
    "/:id/overview",
    {
      schema: {
        summary: "Get contributor onboarding report",
        tags: ["Repositories"],
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: RepoOverviewResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const overview = await overviewRepo.findLatestByRepo(request.params.id);
      if (!overview) {
        return reply.status(404).send({
          title: "Overview Not Found",
          status: 404,
          detail: `No onboarding report found for repository '${request.params.id}'.`,
        });
      }

      return reply.status(200).send({
        repoId: overview.repoId,
        version: overview.version,
        generatedAt: overview.generatedAt.toISOString(),
        sections: overview.sections as any,
      });
    }
  );

  // GET /api/v1/repos/:id/status - Live SSE Status
  fastify.get(
    "/:id/status",
    {
      schema: {
        summary: "Stream real-time indexing status via SSE",
        tags: ["Repositories"],
        params: z.object({ id: z.string().uuid() }),
      },
    },
    async (request, reply) => {
      const repo = await repoRepo.findById(request.params.id);
      if (!repo) {
        return reply.status(404).send({
          title: "Repository Not Found",
          status: 404,
          detail: "Repository not found",
        });
      }

      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache");
      reply.raw.setHeader("Connection", "keep-alive");

      const job = await jobRepo.findLatestByRepo(request.params.id);
      const payload = {
        repoId: repo.id,
        status: repo.status,
        progress: job?.progress ?? (repo.status === "ready" ? 100 : 0),
        currentStep: job?.currentStep ?? repo.status,
      };

      reply.raw.write(`event: status\ndata: ${JSON.stringify(payload)}\n\n`);
      reply.raw.end();
    }
  );

  // POST /api/v1/repos/:id/refresh - Trigger incremental re-indexing
  fastify.post(
    "/:id/refresh",
    {
      schema: {
        summary: "Trigger incremental re-indexing using commit diff",
        tags: ["Repositories"],
        params: z.object({ id: z.string().uuid() }),
        response: {
          202: IndexRepoResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const repo = await repoRepo.findById(request.params.id);
      if (!repo) {
        return reply.status(404).send({
          title: "Repository Not Found",
          status: 404,
          detail: "Repository not found",
        });
      }

      const job = await jobRepo.create({
        repoId: repo.id,
        status: "pending",
        progress: 0,
        currentStep: "reindexing_diff",
      });

      return reply.status(202).send({
        repoId: repo.id,
        jobId: job.id,
        status: "queued",
        message: "Incremental re-indexing job queued.",
      });
    }
  );

  // DELETE /api/v1/repos/:id - Delete repository and all cascaded data
  fastify.delete(
    "/:id",
    {
      schema: {
        summary: "Delete repository and all cascaded files, chunks, and memories",
        tags: ["Repositories"],
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: z.object({ success: z.boolean(), message: z.string() }),
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const deleted = await repoRepo.delete(request.params.id);
      if (!deleted) {
        return reply.status(404).send({
          title: "Repository Not Found",
          status: 404,
          detail: "Repository not found",
        });
      }
      return reply.status(200).send({
        success: true,
        message: `Repository '${request.params.id}' and all associated data deleted successfully.`,
      });
    }
  );

  // GET /api/v1/repos/:id/files - List files
  fastify.get(
    "/:id/files",
    {
      schema: {
        summary: "List all indexed files for repository tree exploration",
        tags: ["Repositories"],
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: z.array(FileNodeResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const files = await chunkRepo.listFilesByRepo(request.params.id);
      return reply.status(200).send(
        files.map((f) => ({
          id: f.id,
          path: f.path,
          language: f.language,
          size: f.size,
        }))
      );
    }
  );

  // GET /api/v1/repos/:id/files/:fileId - View file content with optional line ranges
  fastify.get(
    "/:id/files/:fileId",
    {
      schema: {
        summary: "View file content with optional start and end line ranges",
        tags: ["Repositories"],
        params: z.object({ id: z.string().uuid(), fileId: z.string().uuid() }),
        querystring: z.object({
          startLine: z.coerce.number().optional(),
          endLine: z.coerce.number().optional(),
        }),
        response: {
          200: FileContentResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const file = await chunkRepo.findFileById(request.params.fileId);
      if (!file) {
        return reply.status(404).send({
          title: "File Not Found",
          status: 404,
          detail: "Source file not found",
        });
      }

      // Fetch chunks for this file to reconstruct or provide snippet
      const chunks = await chunkRepo.findChunksByRepo(request.params.id, 100);
      const fileChunks = chunks.filter((c) => c.fileId === file.id);
      const fullText = fileChunks.map((c) => c.content).join("\n\n");

      return reply.status(200).send({
        id: file.id,
        path: file.path,
        language: file.language,
        size: file.size,
        content: fullText,
        startLine: request.query.startLine,
        endLine: request.query.endLine,
      });
    }
  );

  // GET /api/v1/repos/:id/memory - List memories
  fastify.get(
    "/:id/memory",
    {
      schema: {
        summary: "Get persistent memory records for repository",
        tags: ["Memory"],
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: z.array(MemoryRecordSchema),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user?.id || null;
      const records = await memoryRepo.listByRepo(request.params.id, userId);
      return reply.status(200).send(
        records.map((r) => ({
          id: r.id,
          userId: r.userId,
          repoId: r.repoId,
          type: r.type as any,
          summary: r.summary,
          metadata: r.metadata as Record<string, unknown>,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }))
      );
    }
  );

  // PATCH /api/v1/repos/:id/memory/:memoryId - Update memory
  fastify.patch(
    "/:id/memory/:memoryId",
    {
      schema: {
        summary: "Update memory summary record",
        tags: ["Memory"],
        params: z.object({ id: z.string().uuid(), memoryId: z.string().uuid() }),
        body: UpdateMemoryRequestSchema,
        response: {
          200: MemoryRecordSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const updated = await memoryRepo.update(request.params.memoryId, request.body.summary);
      if (!updated) {
        return reply.status(404).send({
          title: "Memory Record Not Found",
          status: 404,
          detail: "Memory record not found",
        });
      }

      return reply.status(200).send({
        id: updated.id,
        userId: updated.userId,
        repoId: updated.repoId,
        type: updated.type as any,
        summary: updated.summary,
        metadata: updated.metadata as Record<string, unknown>,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
    }
  );

  // DELETE /api/v1/repos/:id/memory/:memoryId - Delete memory
  fastify.delete(
    "/:id/memory/:memoryId",
    {
      schema: {
        summary: "Delete memory record",
        tags: ["Memory"],
        params: z.object({ id: z.string().uuid(), memoryId: z.string().uuid() }),
        response: {
          200: z.object({ success: z.boolean(), message: z.string() }),
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const deleted = await memoryRepo.delete(request.params.memoryId);
      if (!deleted) {
        return reply.status(404).send({
          title: "Memory Record Not Found",
          status: 404,
          detail: "Memory record not found",
        });
      }
      return reply.status(200).send({
        success: true,
        message: "Memory record deleted successfully.",
      });
    }
  );
};
