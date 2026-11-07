import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  SendMessageRequestSchema,
  MessageResponseSchema,
  EnhancementRequestSchema,
  ErrorResponseSchema,
  CodeCitation,
  MessageRole,
  RepoOverviewSections,
} from "@repomentor/shared";
import {
  ConversationRepository,
  RepoRepository,
  OverviewRepository,
  ChunkRepository,
  MemoryRepository,
} from "@repomentor/db";
import {
  CodeHybridRetriever,
  classifyQuestionIntent,
  getIntentSystemInstructions,
  rewriteQueryToStandalone,
  extractCitationsFromMarkdown,
  TokenBudgeter,
  EnhancementAssistant,
  MockLLMProvider,
  AnthropicClaudeProvider,
  GeminiProvider,
  MockEmbeddingProvider,
  VoyageAIEmbeddingProvider,
} from "@repomentor/core";

export const chatRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const convoRepo = new ConversationRepository();
  const repoRepo = new RepoRepository();
  const overviewRepo = new OverviewRepository();
  const chunkRepo = new ChunkRepository();
  const memoryRepo = new MemoryRepository();

  // Choose providers based on environment (Test -> Gemini -> Anthropic -> Mock fallback)
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

  const hybridRetriever = new CodeHybridRetriever(embedder, {
    searchVector: (repoId, emb, limit) => chunkRepo.searchVector(repoId, emb, limit),
    searchFullText: (repoId, q, limit) => chunkRepo.searchFullText(repoId, q, limit),
  });

  const tokenBudgeter = new TokenBudgeter();
  const enhancementAssistant = new EnhancementAssistant(llm);

  // POST /api/v1/repos/:id/chat - Streaming SSE Chat
  fastify.post(
    "/repos/:id/chat",
    {
      schema: {
        summary: "Stream RAG conversation answer with verifiable line-level citations via SSE",
        tags: ["Chat"],
        params: z.object({ id: z.string().uuid() }),
        body: SendMessageRequestSchema,
      },
    },
    async (request, reply) => {
      const { content, questionType } = request.body;
      const repoId = request.params.id;

      const repo = await repoRepo.findById(repoId);
      if (!repo) {
        return reply.status(404).send({
          title: "Repository Not Found",
          status: 404,
          detail: "Repository not found",
        });
      }

      // 1. Setup SSE streaming headers
      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache");
      reply.raw.setHeader("Connection", "keep-alive");
      reply.hijack();

      // 2. Fetch or create default conversation
      const convos = await convoRepo.listByRepo(repoId);
      let conversationId = convos[0]?.id;
      if (!conversationId) {
        const newConvo = await convoRepo.createConversation({
          repoId,
          title: content.slice(0, 50),
          userId: request.user?.id || null,
        });
        conversationId = newConvo.id;
      }

      // Fetch recent messages
      const historyMessages = await convoRepo.getRecentMessages(conversationId, 6);
      const historyTurns = historyMessages.reverse().map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // 3. Question-type routing
      const intent = questionType || classifyQuestionIntent(content);
      const intentInstructions = getIntentSystemInstructions(intent);

      // 4. Query rewriting for follow-ups
      const standaloneQuery = await rewriteQueryToStandalone(llm, historyTurns, content);

      // 5. Hybrid Retrieval (Vector + FTS via RRF)
      const retrieval = await hybridRetriever.retrieve(standaloneQuery, {
        repoId,
        limit: 8,
      });

      // 6. Memory layer fetch
      const overview = await overviewRepo.findLatestByRepo(repoId);
      const overviewSummary =
        (overview?.sections as RepoOverviewSections | null)?.summary || repo.name;
      const userId = request.user?.id || "00000000-0000-0000-0000-000000000001";
      const userMemory = await memoryRepo.findLatestMemory(userId, repoId);

      // 7. Assemble Prompt via TokenBudgeter
      const assembled = tokenBudgeter.assemble({
        systemInstructions: `${intentInstructions}\nAlways include verifiable code citations [filepath:start_line-end_line]. If not found in code, say so.`,
        repoOverviewSummary: overviewSummary,
        longTermMemorySummary: userMemory?.summary || null,
        retrievedChunks: retrieval.chunks,
        shortTermHistory: historyTurns,
        userQuery: content,
      });

      // 8. Stream tokens to SSE client
      let fullAssistantText = "";

      reply.raw.write(`event: intent\ndata: ${JSON.stringify({ intent, standaloneQuery })}\n\n`);

      try {
        await llm.stream(
          assembled.hydratedPrompt,
          (token) => {
            fullAssistantText += token;
            reply.raw.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
          },
          { maxTokens: 2000, temperature: 0.2 }
        );

        // 9. Extract and stream validated citations
        const citations = extractCitationsFromMarkdown(fullAssistantText);
        for (const citation of citations) {
          reply.raw.write(`event: citation\ndata: ${JSON.stringify(citation)}\n\n`);
        }

        // 10. Persist user and assistant messages
        await convoRepo.addMessage({
          conversationId,
          role: "user",
          content,
          citations: [],
        });

        await convoRepo.addMessage({
          conversationId,
          role: "assistant",
          content: fullAssistantText,
          citations,
        });

        reply.raw.write(`event: done\ndata: ${JSON.stringify({ conversationId })}\n\n`);
      } catch (err) {
        reply.raw.write(`event: error\ndata: ${JSON.stringify({ message: String(err) })}\n\n`);
      } finally {
        reply.raw.end();
      }
    }
  );

  // POST /api/v1/repos/:id/enhancement - Enhancement Assistant
  fastify.post(
    "/repos/:id/enhancement",
    {
      schema: {
        summary: "Generate grounded step-by-step enhancement plan with test strategy and diffs",
        tags: ["Chat"],
        params: z.object({ id: z.string().uuid() }),
        body: EnhancementRequestSchema,
      },
    },
    async (request, reply) => {
      const repo = await repoRepo.findById(request.params.id);
      if (!repo) {
        return reply.status(404).send({
          title: "Repository Not Found",
          status: 404,
          detail: "Repository not found",
        });
      }

      // Retrieve relevant code chunks for the enhancement request
      const retrieval = await hybridRetriever.retrieve(request.body.request, {
        repoId: repo.id,
        limit: 8,
      });

      const plan = await enhancementAssistant.generatePlan({
        repoName: repo.name,
        userRequest: request.body.request,
        relevantChunks: retrieval.chunks,
      });

      return reply.status(200).send(plan);
    }
  );

  // GET /api/v1/conversations/:id/messages - List messages
  fastify.get(
    "/conversations/:id/messages",
    {
      schema: {
        summary: "Get conversation messages with citations",
        tags: ["Chat"],
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: z.array(MessageResponseSchema),
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const messages = await convoRepo.getRecentMessages(request.params.id, 50);
      return reply.status(200).send(
        messages.map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          role: m.role as MessageRole,
          content: m.content,
          citations: (m.citations ?? []) as CodeCitation[],
          createdAt: m.createdAt.toISOString(),
        }))
      );
    }
  );
};
