import { Queue } from "bullmq";
import Redis from "ioredis";
import { env } from "@repomentor/shared";

export const INDEXING_QUEUE_NAME = "repo-indexing";

export interface IndexingJobPayload {
  jobId: string;
  repoId: string;
  url: string;
  branch?: string;
}

let redisClient: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return redisClient;
}

export function createIndexingQueue(): Queue<IndexingJobPayload> {
  const connection = getRedisConnection();
  return new Queue<IndexingJobPayload>(INDEXING_QUEUE_NAME, {
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
}

