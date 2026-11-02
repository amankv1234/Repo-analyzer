import fp from "fastify-plugin";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

export default fp(async (fastify) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "RepoMentor API",
        description: "REST API for AI-powered repository onboarding and RAG chat",
        version: "0.1.0",
      },
      servers: [
        {
          url: "http://localhost:4000",
          description: "Local development server",
        },
      ],
      tags: [
        { name: "System", description: "Health and readiness checks" },
        { name: "Repositories", description: "Repository intake and onboarding reports" },
        { name: "Jobs", description: "Background indexing job status" },
        { name: "Chat", description: "Grounded conversational RAG endpoints" },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });
});

