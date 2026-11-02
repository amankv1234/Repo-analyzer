import fastify, { FastifyInstance } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { randomUUID } from "crypto";
import { ZodError } from "zod";
import { AppError } from "@repomentor/shared";
import corsPlugin from "./plugins/cors";
import swaggerPlugin from "./plugins/swagger";
import authPlugin from "./plugins/auth";
import rateLimitPlugin from "./plugins/rate-limit";
import securityPlugin from "./plugins/security";
import costGuardPlugin from "./plugins/cost-guard";
import requestIdPlugin from "./plugins/request-id";
import metricsPlugin from "./plugins/metrics";
import { healthRoutes } from "./routes/health";
import { repoRoutes } from "./routes/v1/repos";
import { jobRoutes } from "./routes/v1/jobs";
import { chatRoutes } from "./routes/v1/chat";
import { exportRoutes } from "./routes/v1/export";

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
            hostname: req.hostname,
            remoteAddress: req.ip,
          };
        },
      },
    },
    genReqId: () => `req-${randomUUID().slice(0, 8)}`,
    disableRequestLogging: false,
  }).withTypeProvider<ZodTypeProvider>();

  // Set Zod compiler and serializer
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register Core Plugins
  app.register(requestIdPlugin);
  app.register(corsPlugin);
  app.register(swaggerPlugin);
  app.register(securityPlugin);
  app.register(authPlugin);
  app.register(rateLimitPlugin);
  app.register(costGuardPlugin);
  app.register(metricsPlugin);

  // Register Routes
  app.register(healthRoutes);
  app.register(repoRoutes, { prefix: "/api/v1/repos" });
  app.register(jobRoutes, { prefix: "/api/v1/jobs" });
  app.register(chatRoutes, { prefix: "/api/v1" });
  app.register(exportRoutes, { prefix: "/api/v1" });

  // Global RFC 7807 Error Handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, reqId: request.id }, "Request error caught");

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        type: `https://repomentor.dev/errors/${error.code}`,
        title: error.name,
        status: error.statusCode,
        detail: error.message,
        instance: request.url,
        reqId: request.id,
      });
    }

    if (error instanceof ZodError || error.name === "ZodError" || error.validation) {
      return reply.status(400).send({
        type: "https://repomentor.dev/errors/VALIDATION_ERROR",
        title: "Bad Request",
        status: 400,
        detail: error.message,
        instance: request.url,
        reqId: request.id,
      });
    }

    return reply.status(500).send({
      type: "https://repomentor.dev/errors/INTERNAL_SERVER_ERROR",
      title: "Internal Server Error",
      status: 500,
      detail: "An unexpected error occurred. Please try again later.",
      instance: request.url,
      reqId: request.id,
    });
  });

  return app;
}
