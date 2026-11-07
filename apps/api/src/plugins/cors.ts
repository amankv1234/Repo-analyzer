import fp from "fastify-plugin";
import fastifyCors from "@fastify/cors";
import { env } from "@repomentor/shared";

export default fp(async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, server-to-server, postman)
      if (!origin) return cb(null, true);

      // In development, allow any localhost port (e.g. 3000, 3001, 3002)
      if (process.env.NODE_ENV !== "production" && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }

      if (origin === env.CORS_ORIGIN || origin === "http://localhost:3000") {
        return cb(null, true);
      }

      return cb(new Error("Not allowed by CORS"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  });
});
