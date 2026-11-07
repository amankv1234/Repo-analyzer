import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { JobStatusResponseSchema, ErrorResponseSchema, JobStatus } from "@repomentor/shared";
import { JobRepository } from "@repomentor/db";

export const jobRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const jobRepo = new JobRepository();

  fastify.get(
    "/:id",
    {
      schema: {
        summary: "Get background indexing job status",
        tags: ["Jobs"],
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: JobStatusResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const job = await jobRepo.findById(request.params.id);
      if (!job) {
        return reply.status(404).send({
          title: "Job Not Found",
          status: 404,
          detail: `Indexing job with ID '${request.params.id}' was not found.`,
        });
      }

      return reply.status(200).send({
        id: job.id,
        repoId: job.repoId,
        status: job.status as JobStatus,
        progress: job.progress,
        currentStep: job.currentStep,
        error: job.error,
        startedAt: job.startedAt ? job.startedAt.toISOString() : null,
        completedAt: job.completedAt ? job.completedAt.toISOString() : null,
      });
    }
  );
};
