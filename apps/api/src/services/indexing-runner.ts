import { JobRepository, RepoRepository, OverviewRepository } from "@repomentor/db";
import {
  RobustIndexingPipeline,
  AnthropicClaudeProvider,
  GeminiProvider,
  MockLLMProvider,
  VoyageAIEmbeddingProvider,
  MockEmbeddingProvider,
} from "@repomentor/core";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

export interface IndexingRunnerParams {
  jobId: string;
  repoId: string;
  url: string;
  branch?: string;
}

export async function runIndexingDirectly({ jobId, repoId, url, branch }: IndexingRunnerParams) {
  const jobRepo = new JobRepository();
  const repoRepo = new RepoRepository();
  const overviewRepo = new OverviewRepository();

  logger.info({ jobId, repoId, url }, "Starting direct background repository indexing pipeline");

  const llm =
    process.env.NODE_ENV === "test"
      ? new MockLLMProvider()
      : process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("placeholder")
        ? new GeminiProvider()
        : process.env.LLM_PROVIDER === "anthropic" &&
            process.env.ANTHROPIC_API_KEY &&
            !process.env.ANTHROPIC_API_KEY.includes("dummy")
          ? new AnthropicClaudeProvider()
          : new MockLLMProvider();

  const embedder =
    process.env.NODE_ENV === "test"
      ? new MockEmbeddingProvider()
      : process.env.EMBEDDING_PROVIDER === "voyage" &&
          process.env.VOYAGE_API_KEY &&
          !process.env.VOYAGE_API_KEY.includes("dummy")
        ? new VoyageAIEmbeddingProvider()
        : new MockEmbeddingProvider();

  const pipeline = new RobustIndexingPipeline({ llm, embedder });

  try {
    const result = await pipeline.execute({
      repoId,
      repoUrl: url,
      branch,
      onProgress: async (update) => {
        logger.info({ jobId, step: update.step, percent: update.progressPercent }, update.message);
        try {
          await jobRepo.updateProgress(jobId, update.progressPercent, update.step);
        } catch {
          // ignore transient progress update errors
        }
      },
    });

    // Persist overview
    await overviewRepo.create({
      repoId,
      version: 1,
      sections: result.overview,
    });

    // Mark completed
    await jobRepo.markCompleted(jobId);
    await repoRepo.updateStatus(repoId, "ready", result.headCommit);

    logger.info(
      {
        jobId,
        repoId,
        filesCount: result.filesIndexedCount,
        chunksCount: result.chunksIndexedCount,
      },
      "Direct repository indexing pipeline completed successfully"
    );

    return {
      success: true,
      repoId,
      headCommit: result.headCommit,
      filesCount: result.filesIndexedCount,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error({ err: error, jobId, repoId }, "Direct repository indexing pipeline failed");
    await jobRepo.markFailed(jobId, errorMsg).catch(() => {});
    await repoRepo.updateStatus(repoId, "failed").catch(() => {});
    throw error;
  }
}
