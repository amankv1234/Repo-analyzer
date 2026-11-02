import { ASTChunk, ParsedSymbol } from "../parser/ast-parser.interface";
import { UniversalSymbolExtractor } from "./ast-symbol-extractor";

export interface ASTChunkerOptions {
  minChunkTokens?: number; // default: 50
  maxChunkTokens?: number; // default: 800
}

/**
 * Estimates token count using standard ~4 chars/token heuristic.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Chunks code files at the AST symbol level (functions, classes, interfaces, methods).
 */
export class ASTCodeChunker {
  private maxTokens: number;

  constructor(options: ASTChunkerOptions = {}) {
    this.maxTokens = options.maxChunkTokens ?? 800;
  }

  chunk(filePath: string, language: string, content: string): ASTChunk[] {
    const lines = content.split("\n");
    if (lines.length === 0) return [];

    const extractor = new UniversalSymbolExtractor(language);
    const symbols = extractor.extractSymbols(filePath, content);

    // If no symbols found, return file as whole or split by sliding window
    if (symbols.length === 0) {
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

    const chunks: ASTChunk[] = [];
    const coveredLines = new Set<number>();

    for (const sym of symbols) {
      const startIdx = Math.max(0, sym.startLine - 1);
      const endIdx = Math.min(lines.length, sym.endLine);
      const symbolLines = lines.slice(startIdx, endIdx);
      const symbolContent = symbolLines.join("\n");
      const tokenCount = estimateTokens(symbolContent);

      // Mark lines covered
      for (let l = sym.startLine; l <= sym.endLine; l++) {
        coveredLines.add(l);
      }

      // If symbol is within token budget, keep intact
      if (tokenCount <= this.maxTokens) {
        chunks.push({
          filePath,
          language,
          content: symbolContent,
          startLine: sym.startLine,
          endLine: sym.endLine,
          symbolName: sym.name,
          symbolType: sym.type,
          metadata: {
            parentSymbol: sym.parentSymbol ?? null,
            tokenEstimate: tokenCount,
          },
        });
      } else {
        // Hierarchical splitting of oversized classes / functions
        const subChunks = this.splitOversizedSymbol(
          filePath,
          language,
          sym,
          symbolLines,
          this.maxTokens
        );
        chunks.push(...subChunks);
      }
    }

    return chunks;
  }

  private splitOversizedSymbol(
    filePath: string,
    language: string,
    sym: ParsedSymbol,
    lines: string[],
    maxTokens: number
  ): ASTChunk[] {
    const chunks: ASTChunk[] = [];
    const maxLinesPerSubChunk = Math.max(30, Math.floor((maxTokens * 4) / 40));
    const headerPrefix = `// Context: ${sym.type} ${sym.name} (Part of ${filePath})\n`;

    for (let i = 0; i < lines.length; i += maxLinesPerSubChunk) {
      const slice = lines.slice(i, i + maxLinesPerSubChunk);
      const subContent = headerPrefix + slice.join("\n");
      const startLine = sym.startLine + i;
      const endLine = Math.min(sym.endLine, startLine + slice.length - 1);

      chunks.push({
        filePath,
        language,
        content: subContent,
        startLine,
        endLine,
        symbolName: sym.name,
        symbolType: sym.type,
        metadata: {
          parentSymbol: sym.name,
          tokenEstimate: estimateTokens(subContent),
        },
      });
    }

    return chunks;
  }
}

