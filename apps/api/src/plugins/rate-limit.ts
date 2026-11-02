import fp from "fastify-plugin";
import fastifyRateLimit from "@fastify/rate-limit";

export default fp(async (fastify) => {
  await fastify.register(fastifyRateLimit, {
    max: 100, // 100 requests per minute default
    timeWindow: "1 minute",
    keyGenerator: (req) => {
      // Rate limit per authenticated user if present, otherwise by IP
      return req.user?.id || req.ip;
    },
    errorResponseBuilder: (_req, context) => ({
      type: "https://repomentor.dev/errors/RATE_LIMIT_EXCEEDED",
      title: "Rate Limit Exceeded",
      status: 429,
      detail: `Rate limit exceeded. Try again in ${context.after}.`,
    }),
  });
});

