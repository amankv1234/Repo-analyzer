import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { FastifyInstance } from "fastify";

const mockRepo = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  url: "https://github.com/facebook/react",
  owner: "facebook",
  name: "react",
  defaultBranch: "main",
  status: "ready",
};

const mockConversation = {
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  repoId: mockRepo.id,
  title: "Chat 1",
  userId: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const mockMessage = {
  id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  conversationId: mockConversation.id,
  role: "assistant",
  content: "Here is the code in [src/index.ts:1-10].",
  citations: [
    {
      filePath: "src/index.ts",
      startLine: 1,
      endLine: 10,
      confidence: 1.0,
      sourceSnippet: "export function main() {}",
    },
  ],
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

vi.mock("@repomentor/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@repomentor/db")>();
  return {
    ...actual,
    RepoRepository: vi.fn().mockImplementation(() => ({
      findById: vi.fn().mockImplementation((id: string) =>
        Promise.resolve(id === mockRepo.id ? mockRepo : null)
      ),
    })),
    OverviewRepository: vi.fn().mockImplementation(() => ({
      findLatestByRepo: vi.fn().mockResolvedValue({
        repoId: mockRepo.id,
        sections: { purposeAndProblem: "React UI library" },
      }),
    })),
    ConversationRepository: vi.fn().mockImplementation(() => ({
      listByRepo: vi.fn().mockResolvedValue([mockConversation]),
      createConversation: vi.fn().mockResolvedValue(mockConversation),
      getRecentMessages: vi.fn().mockResolvedValue([mockMessage]),
      addMessage: vi.fn().mockResolvedValue(mockMessage),
    })),
    ChunkRepository: vi.fn().mockImplementation(() => ({
      searchVector: vi.fn().mockResolvedValue([
        {
          id: "chunk-1",
          fileId: "f-1",
          filePath: "src/index.ts",
          startLine: 1,
          endLine: 10,
          symbolName: "main",
          symbolType: "function",
          content: "export function main() {}",
          score: 0.9,
        },
      ]),
      searchFullText: vi.fn().mockResolvedValue([]),
    })),
    MemoryRepository: vi.fn().mockImplementation(() => ({
      listByRepo: vi.fn().mockResolvedValue([]),
      findLatestMemory: vi.fn().mockResolvedValue(null),
    })),
  };
});

import { buildApp } from "../src/app";

describe("API Chat & Enhancement Endpoints", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/repos/:id/enhancement should return a grounded enhancement plan", async () => {
    const response = await app.inject({
      method: "POST",
      url: `/api/v1/repos/${mockRepo.id}/enhancement`,
      payload: {
        request: "Add support for server action telemetry",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.summary).toBeDefined();
    expect(body.targetFiles).toBeInstanceOf(Array);
    expect(body.stepByStepPlan).toBeInstanceOf(Array);
    expect(body.testPlan).toBeInstanceOf(Array);
  });

  it("GET /api/v1/conversations/:id/messages should return conversation message history", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/conversations/${mockConversation.id}/messages`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.length).toBe(1);
    expect(body[0].role).toBe("assistant");
    expect(body[0].citations.length).toBe(1);
    expect(body[0].citations[0].filePath).toBe("src/index.ts");
  });

  it("POST /api/v1/repos/:id/chat should stream SSE response", async () => {
    const response = await app.inject({
      method: "POST",
      url: `/api/v1/repos/${mockRepo.id}/chat`,
      payload: {
        content: "Where is the main entry point?",
        questionType: "where_is_implemented",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("text/event-stream");
    expect(response.body).toContain("event: token");
    expect(response.body).toContain("event: done");
  });
});

