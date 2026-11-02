import { SymbolType } from "@repomentor/shared";

export interface ParsedSymbol {
  name: string;
  type: SymbolType;
  startLine: number;
  endLine: number;
  parentSymbol?: string | null;
  docstring?: string | null;
}

export interface ASTChunk {
  filePath: string;
  language: string;
  content: string;
  startLine: number;
  endLine: number;
  symbolName: string | null;
  symbolType: SymbolType | null;
  metadata: {
    parentSymbol?: string | null;
    docstring?: string | null;
    imports?: string[];
    tokenEstimate?: number;
  };
}

export interface ASTParseResult {
  filePath: string;
  language: string;
  symbols: ParsedSymbol[];
  chunks: ASTChunk[];
}

export interface CodeParser {
  readonly supportedLanguages: readonly string[];

  supports(filePath: string): boolean;

  parse(filePath: string, content: string): Promise<ASTParseResult>;
}

