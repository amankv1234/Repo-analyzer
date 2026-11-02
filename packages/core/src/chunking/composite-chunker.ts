import { ASTChunk } from "../parser/ast-parser.interface";
import { ASTCodeChunker } from "./ast-chunker";
import { chunkMarkdown } from "./markdown-chunker";
import { chunkWithSlidingWindow } from "./sliding-window-chunker";

const AST_SUPPORTED_LANGUAGES = new Set([
  "typescript",
  "javascript",
  "python",
  "go",
  "rust",
  "java",
  "c",
  "cpp",
  "csharp",
]);

export class CompositeChunker {
  private astChunker: ASTCodeChunker;

  constructor() {
    this.astChunker = new ASTCodeChunker();
  }

  chunk(filePath: string, language: string, content: string): ASTChunk[] {
    if (language === "markdown") {
      return chunkMarkdown(filePath, content);
    }

    if (AST_SUPPORTED_LANGUAGES.has(language)) {
      return this.astChunker.chunk(filePath, language, content);
    }

    return chunkWithSlidingWindow(filePath, language, content);
  }
}

