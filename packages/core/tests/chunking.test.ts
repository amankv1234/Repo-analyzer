import { describe, it, expect } from "vitest";
import { ASTCodeChunker } from "../src/chunking/ast-chunker";
import { chunkMarkdown } from "../src/chunking/markdown-chunker";
import { chunkWithSlidingWindow } from "../src/chunking/sliding-window-chunker";
import { CompositeChunker } from "../src/chunking/composite-chunker";

describe("Chunking Engine", () => {
  it("should extract functions and classes from TypeScript source code", () => {
    const code = `
export class AuthService {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  async validateToken(token: string): Promise<boolean> {
    return token.length > 10;
  }
}

export function hashPassword(raw: string): string {
  return "hash_" + raw;
}
`;

    const chunker = new ASTCodeChunker();
    const chunks = chunker.chunk("src/auth.ts", "typescript", code);

    expect(chunks.length).toBeGreaterThanOrEqual(2);
    const symbolNames = chunks.map((c) => c.symbolName);
    expect(symbolNames).toContain("AuthService");
    expect(symbolNames).toContain("hashPassword");
  });

  it("should extract Python functions and classes with correct indentation bounds", () => {
    const pythonCode = `
class RepositoryPipeline:
    def __init__(self, repo_url):
        self.url = repo_url

    def clone(self):
        print("Cloning repo...")
        return True

def standalone_helper(data):
    return data.strip()
`;

    const chunker = new ASTCodeChunker();
    const chunks = chunker.chunk("pipeline.py", "python", pythonCode);

    expect(chunks.length).toBeGreaterThanOrEqual(2);
    const symbolNames = chunks.map((c) => c.symbolName);
    expect(symbolNames).toContain("RepositoryPipeline");
    expect(symbolNames).toContain("standalone_helper");
  });

  it("should split Markdown files along section headings", () => {
    const md = `
# Project Overview
Welcome to the project.

## Architecture
We use a microservices approach with Fastify and BullMQ.

### Storage
Postgres is our primary store.

## Getting Started
Run pnpm install.
`;

    const chunks = chunkMarkdown("README.md", md);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    const headings = chunks.map((c) => c.symbolName);
    expect(headings).toContain("Project Overview");
    expect(headings).toContain("Architecture");
    expect(headings).toContain("Getting Started");
  });

  it("should create overlapping chunks with sliding window for config files", () => {
    const longConfig = Array.from({ length: 120 }, (_, i) => `config.key_${i} = value_${i};`).join("\n");
    const chunks = chunkWithSlidingWindow("app.conf", "plaintext", longConfig, {
      windowLines: 40,
      overlapLines: 10,
    });

    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks[0]!.startLine).toBe(1);
    expect(chunks[0]!.endLine).toBe(40);
  });

  it("should correctly route file types via CompositeChunker", () => {
    const composite = new CompositeChunker();

    const mdChunks = composite.chunk("docs/setup.md", "markdown", "# Setup\nSteps here.");
    expect(mdChunks[0]!.language).toBe("markdown");

    const tsChunks = composite.chunk("src/index.ts", "typescript", "export function run() { return 1; }");
    expect(tsChunks[0]!.symbolName).toBe("run");
  });
});

