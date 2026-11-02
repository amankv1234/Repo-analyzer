import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { FastifyInstance } from "fastify";

// In-memory fake database state for repository routes
const mockRepo = {
  id: "11111111-1111-1111-1111-111111111111",
  url: "https://github.com/facebook/react",
  owner: "facebook",
  name: "react",
  defaultBranch: "main",
  lastIndexedCommit: "abcdef123456",
  status: "ready",
  size: 524000,
  languages: { TypeScript: 60, JavaScript: 40 },
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const mockOverview = {
  id: "22222222-2222-2222-2222-222222222222",
  repoId: "11111111-1111-1111-1111-111111111111",
  version: 1,
  generatedAt: new Date("2026-01-01T00:00:00Z"),
  sections: {
    summary: "React is a JavaScript library for building user interfaces.",
    purpose: "Declarative component-based UI engineering.",
    techStack: [
      { name: "TypeScript", category: "Language", justification: "Strong typing" },
    ],
    architecture: {
      description: "Component-based architecture with virtual DOM.",
      mermaidDiagram: "graph TD;\n  A[App] --> B[Component];",
    },
    folderStructure: [
      { path: "packages/react", description: "Core React package" },
    ],
    setupGuide: {
      prerequisites: ["Node.js 18+"],
      steps: ["pnpm install", "pnpm build"],
      troubleshooting: ["Clear cache"],
    },
    keyFiles: [
      { path: "packages/react/index.js", reason: "Main entry point", readOrder: 1 },
    ],
    contributionWorkflow: {
      branchNaming: "feature/*",
      prProcess: "Fork, branch, PR with tests.",
      commitFormat: "Conventional Commits",
    },
    codeConventions: ["ESLint + Prettier"],
    commonPitfalls: ["Do not mutate state directly"],
    goodFirstAreas: ["Documentation and typing fixes"],
  },
};

const mockJob = {
  id: "33333333-3333-3333-3333-333333333333",
  repoId: "11111111-1111-1111-1111-111111111111",
  status: "completed",
  progress: 100,
  currentStep: "completed",
  errorMessage: null,
};

vi.mock("@repomentor/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@repomentor/db")>();
  return {
    ...actual,
    RepoRepository: vi.fn().mockImplementation(() => ({
      listAll: vi.fn().mockResolvedValue([mockRepo]),
      findById: vi.fn().mockImplementation((id: string) =>
        Promise.resolve(id === mockRepo.id ? mockRepo : null)
      ),
      findByUrl: vi.fn().mockImplementation((url: string) =>
        Promise.resolve(url === mockRepo.url ? mockRepo : null)
      ),
      create: vi.fn().mockResolvedValue(mockRepo),
      delete: vi.fn().mockImplementation((id: string) =>
        Promise.resolve(id === mockRepo.id)
      ),
    })),
    OverviewRepository: vi.fn().mockImplementation(() => ({
      findLatestByRepo: vi.fn().mockImplementation((id: string) =>
        Promise.resolve(id === mockRepo.id ? mockOverview : null)
      ),
    })),
    JobRepository: vi.fn().mockImplementation(() => ({
      create: vi.fn().mockResolvedValue(mockJob),
      findLatestByRepo: vi.fn().mockResolvedValue(mockJob),
      findById: vi.fn().mockResolvedValue(mockJob),
    })),
    ChunkRepository: vi.fn().mockImplementation(() => ({
      listFilesByRepo: vi.fn().mockResolvedValue([
        {
          id: "44444444-4444-4444-4444-444444444444",
          path: "packages/react/index.js",
          language: "javascript",
          size: 1024,
        },
      ]),
      findFileById: vi.fn().mockImplementation((id: string) =>
        Promise.resolve({
          id,
          path: "packages/react/index.js",
          language: "javascript",
          size: 1024,
        })
      ),
      findChunksByRepo: vi.fn().mockResolvedValue([
        {
          fileId: "44444444-4444-4444-4444-444444444444",
          content: "export function useState() { return []; }",
        },
      ]),
    })),
    MemoryRepository: vi.fn().mockImplementation(() => ({
      listByRepo: vi.fn().mockResolvedValue([
        {
          id: "55555555-5555-5555-5555-555555555555",
          userId: null,
          repoId: mockRepo.id,
          type: "long_term_summary",
          summary: "Understand React fiber reconciler",
          metadata: {},
          createdAt: new Date("2026-01-01T00:00:00Z"),
          updatedAt: new Date("2026-01-01T00:00:00Z"),
        },
      ]),
      delete: vi.fn().mockResolvedValue(true),
    })),
  };
});

import { buildApp } from "../src/app";

describe("API Repository Endpoints", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/repos should queue a repository for onboarding analysis", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/repos",
      payload: {
        url: "https://github.com/facebook/react",
        branch: "main",
      },
    });

    expect(response.statusCode).toBe(202);
    const body = JSON.parse(response.body);
    expect(body.repoId).toBe(mockRepo.id);
    expect(body.jobId).toBe(mockJob.id);
    expect(body.status).toBe("queued");
  });

  it("POST /api/v1/repos with invalid URL should fail validation", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/repos",
      payload: {
        url: "https://malicious-site.com/repo",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("GET /api/v1/repos should return all indexed repositories", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/repos",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
    expect(body[0].owner).toBe("facebook");
  });

  it("GET /api/v1/repos/:id should return repository details", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/repos/${mockRepo.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(mockRepo.id);
    expect(body.name).toBe("react");
  });

  it("GET /api/v1/repos/:id/overview should return onboarding report", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/repos/${mockRepo.id}/overview`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.repoId).toBe(mockRepo.id);
    expect(body.sections.summary).toContain("React is a JavaScript library");
  });

  it("GET /api/v1/repos/:id/files should return indexed file tree", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/repos/${mockRepo.id}/files`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body[0].path).toBe("packages/react/index.js");
  });

  it("GET /api/v1/repos/:id/memory should return user repo memories", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/repos/${mockRepo.id}/memory`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body[0].summary).toBe("Understand React fiber reconciler");
  });

  it("DELETE /api/v1/repos/:id should delete repository", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/api/v1/repos/${mockRepo.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });
});

