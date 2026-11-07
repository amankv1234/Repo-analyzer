import {
  IndexingPipeline,
  IndexingPipelineOptions,
  IndexingResult,
} from "./indexing-pipeline.interface";
import { JobStep } from "@repomentor/shared";
import { parseGitHubUrl } from "../ingestion/github-url";
import { fetchGitHubMetadata } from "../ingestion/metadata";
import { cloneShallow, cleanupClonedRepo } from "../ingestion/git-cloner";
import { filterRepositoryFiles } from "../ingestion/file-filter";
import { analyzeRepository } from "../analysis/repo-analyzer";
import { CompositeChunker } from "../chunking/composite-chunker";
import { EmbeddingProvider } from "../embeddings/provider.interface";
import { computeContentHash, EmbeddingContentCache } from "../embeddings/embedding-cache";
import { LLMProvider } from "../llm/provider.interface";
import { OverviewGenerator } from "../overview/overview-generator";
import fs from "fs";

export interface PipelineDependencies {
  llm: LLMProvider;
  embedder: EmbeddingProvider;
}

export class RobustIndexingPipeline implements IndexingPipeline {
  private chunker = new CompositeChunker();
  private embeddingCache = new EmbeddingContentCache();

  constructor(private deps: PipelineDependencies) {}

  async execute(options: IndexingPipelineOptions): Promise<IndexingResult> {
    const { repoId, repoUrl, branch, onProgress } = options;

    const report = async (step: JobStep, percent: number, message?: string) => {
      if (onProgress) {
        await onProgress({ step, progressPercent: percent, message });
      }
    };

    // 1. Validate URL
    await report("validating", 5, "Validating repository URL and security boundaries");
    const parsed = parseGitHubUrl(repoUrl);

    // 2. Fetch Metadata
    await report("metadata", 15, "Fetching GitHub repository metadata");
    let metadata;
    try {
      metadata = await fetchGitHubMetadata(parsed.owner, parsed.repo);
    } catch {
      // Fallback metadata if offline or rate limited
      metadata = {
        owner: parsed.owner,
        name: parsed.repo,
        description: null,
        stars: 0,
        topics: [],
        license: null,
        defaultBranch: branch || "main",
        contributorsCount: 1,
        lastCommitSha: "HEAD",
        openIssuesCount: 0,
        languages: {},
      };
    }

    // 3. Shallow Clone into Isolated Temp Dir
    await report("cloning", 30, "Performing secure shallow clone (--depth 1)");
    const cloned = await cloneShallow({
      url: parsed.normalizedUrl,
      branch: branch || metadata.defaultBranch,
      maxSizeMb: 100,
    });

    try {
      // 4. File Filter & Static Analysis
      await report("analyzing", 45, "Running AST file filters and deterministic static analysis");
      const files = await filterRepositoryFiles(cloned.localPath);
      const facts = await analyzeRepository({ repoDir: cloned.localPath, files });

      // 5. AST Chunking
      await report("parsing_ast", 60, `Parsing AST symbols across ${files.length} source files`);
      const allChunks = [];
      const keySnippets = [];

      for (const file of files) {
        try {
          const content = fs.readFileSync(file.absolutePath, "utf-8");
          const chunks = this.chunker.chunk(file.relativePath, file.language, content);
          allChunks.push(...chunks);

          // Select top files for overview context
          if (
            file.relativePath.includes("main.") ||
            file.relativePath.includes("index.") ||
            file.relativePath.includes("server.") ||
            file.relativePath.includes("App.")
          ) {
            keySnippets.push({
              filePath: file.relativePath,
              content: content.slice(0, 3000),
            });
          }
        } catch {
          // ignore unreadable
        }
      }

      // 6. Batch Embeddings with Content Hashing Cache
      await report(
        "generating_embeddings",
        75,
        `Generating vector embeddings for ${allChunks.length} chunks`
      );
      const textsToEmbed: string[] = [];
      const textsIndices: number[] = [];

      for (let i = 0; i < allChunks.length; i++) {
        const c = allChunks[i]!;
        const hash = computeContentHash(c.content);
        if (!this.embeddingCache.has(hash)) {
          textsToEmbed.push(c.content);
          textsIndices.push(i);
        }
      }

      if (textsToEmbed.length > 0) {
        const batchResult = await this.deps.embedder.embedBatch(textsToEmbed);
        for (let j = 0; j < textsToEmbed.length; j++) {
          const text = textsToEmbed[j]!;
          const vector = batchResult.embeddings[j]!;
          this.embeddingCache.set(computeContentHash(text), vector);
        }
      }

      // 7. Synthesize Onboarding Report via LLM
      await report(
        "synthesizing_overview",
        90,
        "Synthesizing 7-section Contributor Onboarding Report"
      );
      const overviewGenerator = new OverviewGenerator(this.deps.llm);
      const overview = await overviewGenerator.generateOverview({
        owner: parsed.owner,
        repo: parsed.repo,
        facts,
        keySnippets: keySnippets.slice(0, 5),
      });

      // 8. Finalize
      await report("completed", 100, "Repository indexing completed successfully");

      return {
        repoId,
        headCommit: cloned.headCommitSha || metadata.lastCommitSha,
        filesIndexedCount: files.length,
        chunksIndexedCount: allChunks.length,
        overview,
      };
    } finally {
      // Guarantee cleanup of shallow cloned temp directory
      await cleanupClonedRepo(cloned.localPath);
    }
  }
}
