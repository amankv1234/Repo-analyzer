import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const requestIdPluginCallback: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onSend", async (request, reply) => {
    reply.header("X-Request-Id", request.id);
  });
};

export default fp(requestIdPluginCallback, { name: "request-id-plugin" });

