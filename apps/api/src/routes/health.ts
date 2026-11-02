import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { pool } from "@repomentor/db";

const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string(),
  uptime: z.number(),
});

const ReadyResponseSchema = z.object({
  status: z.enum(["ready", "degraded", "unavailable"]),
  services: z.object({
    database: z.enum(["connected", "disconnected"]),
  }),
  timestamp: z.string(),
});

export const healthRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/health",
    {
      schema: {
        summary: "Liveness probe",
        description: "Returns OK if the HTTP service process is alive",
        tags: ["System"],
        response: {
          200: HealthResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      return reply.status(200).send({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    }
  );

  fastify.get(
    "/ready",
    {
      schema: {
        summary: "Readiness probe",
        description: "Checks whether backend dependencies (database) are ready to accept traffic",
        tags: ["System"],
        response: {
          200: ReadyResponseSchema,
          503: ReadyResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      let dbStatus: "connected" | "disconnected" = "connected";

      try {
        const client = await pool.connect();
        await client.query("SELECT 1;");
        client.release();
      } catch {
        dbStatus = "disconnected";
      }

      const isReady = dbStatus === "connected";
      const statusCode = isReady ? 200 : 503;

      return reply.status(statusCode).send({
        status: isReady ? "ready" : "unavailable",
        services: {
          database: dbStatus,
        },
        timestamp: new Date().toISOString(),
      });
    }
  );
};

