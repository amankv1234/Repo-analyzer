import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const securityPluginCallback: FastifyPluginAsync = async (fastify) => {
  // Set standard security headers on every response
  fastify.addHook("onSend", async (_request, reply) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("X-XSS-Protection", "1; mode=block");
    reply.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    reply.header(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
    );
  });

  // CSRF verification on state-changing requests when an origin is supplied
  fastify.addHook("preHandler", async (request, reply) => {
    const origin = request.headers.origin;
    const method = request.method;

    if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && origin) {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:4000",
        process.env.APP_URL,
      ].filter(Boolean);

      const isAllowed =
        (process.env.NODE_ENV !== "production" && /^http:\/\/localhost(:\d+)?$/.test(origin)) ||
        allowedOrigins.some((allowed) => allowed && origin.startsWith(allowed));
      if (!isAllowed) {
        return reply.status(403).send({
          title: "Forbidden",
          status: 403,
          detail: `CSRF block: Request origin '${origin}' is not in the allowed CORS list.`,
        });
      }
    }
  });
};

export default fp(securityPluginCallback, { name: "security-plugin" });
