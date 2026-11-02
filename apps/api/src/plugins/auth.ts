import fp from "fastify-plugin";
import { FastifyRequest, FastifyReply } from "fastify";
import * as jose from "jose";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
    };
  }
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "repomentor_super_secret_jwt_key_32_bytes_min!"
);

export async function createJwtToken(payload: { id: string; email: string }): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export default fp(async (fastify) => {
  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    // In local development / tests, support default dev user if no header is supplied
    if (!authHeader) {
      if (process.env.NODE_ENV !== "production") {
        request.user = {
          id: "00000000-0000-0000-0000-000000000001",
          email: "dev@repomentor.local",
        };
        return;
      }
      return reply.status(401).send({
        type: "https://repomentor.dev/errors/UNAUTHORIZED",
        title: "Unauthorized",
        status: 401,
        detail: "Missing Authorization header with Bearer token",
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");

    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      request.user = {
        id: (payload.id as string) || "00000000-0000-0000-0000-000000000001",
        email: (payload.email as string) || "user@repomentor.local",
      };
    } catch {
      return reply.status(401).send({
        type: "https://repomentor.dev/errors/UNAUTHORIZED",
        title: "Unauthorized",
        status: 401,
        detail: "Invalid or expired JWT token",
      });
    }
  });
});

