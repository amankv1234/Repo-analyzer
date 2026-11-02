import fp from "fastify-plugin";
import fastifyCors from "@fastify/cors";
import { env } from "@repomentor/shared";

export default fp(async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: [env.CORS_ORIGIN, "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  });
});

