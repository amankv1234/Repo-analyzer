import { ASTChunk } from "../parser/ast-parser.interface";
import { estimateTokens } from "./ast-chunker";

/**
 * Splits Markdown files by section headings (#, ##, ###), preserving breadcrumb headers.
 */
export function chunkMarkdown(filePath: string, content: string, _maxTokens: number = 800): ASTChunk[] {
  const lines = content.split("\n");
  const chunks: ASTChunk[] = [];

  let currentHeading = "Overview";
  let sectionStartLine = 1;
  let sectionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const isHeading = /^#{1,3}\s+(.+)$/.test(line.trim());

    if (isHeading && sectionLines.length > 0) {
      const sectionContent = sectionLines.join("\n");
      const tokens = estimateTokens(sectionContent);

      if (tokens > 0) {
        chunks.push({
          filePath,
          language: "markdown",
          content: sectionContent,
          startLine: sectionStartLine,
          endLine: i,
          symbolName: currentHeading,
          symbolType: "module",
          metadata: {
            parentSymbol: null,
            tokenEstimate: tokens,
          },
        });
      }

      // Start new section
      const match = line.trim().match(/^#{1,3}\s+(.+)$/);
      currentHeading = match ? match[1]! : "Section";
      sectionStartLine = i + 1;
      sectionLines = [line];
    } else {
      sectionLines.push(line);
    }
  }

  // Push final remaining section
  if (sectionLines.length > 0) {
    const sectionContent = sectionLines.join("\n");
    chunks.push({
      filePath,
      language: "markdown",
      content: sectionContent,
      startLine: sectionStartLine,
      endLine: lines.length,
      symbolName: currentHeading,
      symbolType: "module",
      metadata: {
        tokenEstimate: estimateTokens(sectionContent),
      },
    });
  }

  return chunks;
}

