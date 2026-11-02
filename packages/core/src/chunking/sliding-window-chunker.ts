import { ASTChunk } from "../parser/ast-parser.interface";
import { estimateTokens } from "./ast-chunker";

export interface SlidingWindowOptions {
  windowLines?: number; // default: 60 lines
  overlapLines?: number; // default: 15 lines
}

export function chunkWithSlidingWindow(
  filePath: string,
  language: string,
  content: string,
  options: SlidingWindowOptions = {}
): ASTChunk[] {
  const windowLines = options.windowLines ?? 60;
  const overlapLines = options.overlapLines ?? 15;
  const step = Math.max(1, windowLines - overlapLines);

  const lines = content.split("\n");
  const chunks: ASTChunk[] = [];

  if (lines.length <= windowLines) {
    return [
      {
        filePath,
        language,
        content,
        startLine: 1,
        endLine: lines.length,
        symbolName: null,
        symbolType: null,
        metadata: {
          tokenEstimate: estimateTokens(content),
        },
      },
    ];
  }

  for (let i = 0; i < lines.length; i += step) {
    const slice = lines.slice(i, i + windowLines);
    if (slice.length === 0) break;

    const sliceContent = slice.join("\n");
    chunks.push({
      filePath,
      language,
      content: sliceContent,
      startLine: i + 1,
      endLine: Math.min(lines.length, i + slice.length),
      symbolName: null,
      symbolType: null,
      metadata: {
        tokenEstimate: estimateTokens(sliceContent),
      },
    });

    if (i + windowLines >= lines.length) break;
  }

  return chunks;
}

