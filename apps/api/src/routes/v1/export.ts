import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { RepoRepository, OverviewRepository } from "@repomentor/db";
import {
  exportOverviewAsMarkdown,
  exportOverviewAsContributing,
  findGoodFirstIssues,
} from "@repomentor/core";
import { ErrorResponseSchema, RepoOverviewSections } from "@repomentor/shared";

const GoodFirstIssueSchema = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  url: z.string(),
  labels: z.array(z.string()),
  bodySnippet: z.string(),
  createdAt: z.string(),
});

export const exportRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const repoRepo = new RepoRepository();
  const overviewRepo = new OverviewRepository();

  // GET /api/v1/repos/:id/export/markdown
  fastify.get(
    "/repos/:id/export/markdown",
    {
      schema: {
        summary: "Export onboarding guide as full Markdown document",
        tags: ["Export"],
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: z.string(),
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

      const overview = await overviewRepo.findLatestByRepo(request.params.id);
      if (!overview) {
        return reply.status(404).send({
          title: "Overview Not Found",
          status: 404,
          detail: "No onboarding report found for this repository",
        });
      }

      const md = exportOverviewAsMarkdown(repo.name, overview.sections as unknown as RepoOverviewSections);
      reply.header("Content-Type", "text/markdown; charset=utf-8");
      reply.header("Content-Disposition", `attachment; filename="${repo.name}-overview.md"`);
      return reply.status(200).send(md);
    }
  );

  // GET /api/v1/repos/:id/export/contributing
  fastify.get(
    "/repos/:id/export/contributing",
    {
      schema: {
        summary: "Export onboarding guide formatted as CONTRIBUTING.md",
        tags: ["Export"],
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: z.string(),
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

      const overview = await overviewRepo.findLatestByRepo(request.params.id);
      if (!overview) {
        return reply.status(404).send({
          title: "Overview Not Found",
          status: 404,
          detail: "No onboarding report found for this repository",
        });
      }

      const md = exportOverviewAsContributing(repo.name, overview.sections as unknown as RepoOverviewSections);
      reply.header("Content-Type", "text/markdown; charset=utf-8");
      reply.header("Content-Disposition", `attachment; filename="CONTRIBUTING.md"`);
      return reply.status(200).send(md);
    }
  );

  // GET /api/v1/repos/:id/issues/good-first
  fastify.get(
    "/repos/:id/issues/good-first",
    {
      schema: {
        summary: "Fetch active good first issues from GitHub for this repository",
        tags: ["Repositories"],
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: z.array(GoodFirstIssueSchema),
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

      const issues = await findGoodFirstIssues(repo.owner, repo.name, process.env.GITHUB_TOKEN);
      return reply.status(200).send(issues);
    }
  );
};
