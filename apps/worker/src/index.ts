import { Worker } from "bullmq";
import pino from "pino";
import { getRedisConnection, INDEXING_QUEUE_NAME, IndexingJobPayload } from "./queues/indexing.queue";
import { processIndexingJob } from "./processors/indexing.processor";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

logger.info("Initializing RepoMentor BullMQ Worker daemon...");

const connection = getRedisConnection();

const worker = new Worker<IndexingJobPayload>(INDEXING_QUEUE_NAME, processIndexingJob, {
  connection,
  concurrency: 2,
});

worker.on("ready", () => {
  logger.info(`🚀 BullMQ Worker listening on queue: '${INDEXING_QUEUE_NAME}'`);
});

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Job completed successfully");
});

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Job failed with error");
});

// Graceful Shutdown
const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
for (const signal of signals) {
  process.on(signal, async () => {
    logger.info({ signal }, "Worker received termination signal. Closing queue worker gracefully...");
    try {
      await worker.close();
      await connection.quit();
      logger.info("Worker closed successfully.");
      process.exit(0);
    } catch (err) {
      logger.error(err, "Error during worker shutdown");
      process.exit(1);
    }
  });
}

