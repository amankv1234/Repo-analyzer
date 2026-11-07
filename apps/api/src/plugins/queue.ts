import fp from "fastify-plugin";
import { Queue } from "bullmq";
import Redis from "ioredis";
import { env } from "@repomentor/shared";

const INDEXING_QUEUE_NAME = "repo-indexing";

export interface IndexingJobPayload {
  jobId: string;
  repoId: string;
  url: string;
  branch?: string;
}

declare module "fastify" {
  interface FastifyInstance {
    indexingQueue: Queue<IndexingJobPayload> | null;
  }
}

export default fp(
  async (fastify) => {
    if (process.env.NODE_ENV === "test") {
      fastify.decorate("indexingQueue", {
        add: async () => ({}) as never,
        close: async () => {},
      } as unknown as Queue<IndexingJobPayload>);
      return;
    }

    try {
      const connection = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
        retryStrategy: () => null,
      });

      connection.on("error", (err) => {
        fastify.log.warn({ err: err.message }, "Redis connection error in queue plugin");
      });

      await connection.connect().catch((err) => {
        fastify.log.warn(
          { err: err.message },
          "Redis is not reachable; direct indexing runner will be used"
        );
      });

      if (connection.status === "ready" || connection.status === "connecting") {
        const queue = new Queue<IndexingJobPayload>(INDEXING_QUEUE_NAME, {
          connection,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
            removeOnComplete: 100,
            removeOnFail: 500,
          },
        });

        fastify.decorate("indexingQueue", queue);

        fastify.addHook("onClose", async () => {
          try {
            await queue.close();
            await connection.quit();
          } catch {
            connection.disconnect();
          }
        });
        return;
      }
    } catch (err) {
      fastify.log.warn({ err }, "Failed to setup Redis queue; fallback will run directly");
    }

    fastify.decorate("indexingQueue", null);
  },
  { name: "queue-plugin" }
);
