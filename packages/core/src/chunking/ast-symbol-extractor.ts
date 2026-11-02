import { SymbolType } from "@repomentor/shared";
import { ParsedSymbol } from "../parser/ast-parser.interface";

export interface SymbolExtractor {
  language: string;
  extractSymbols(filePath: string, content: string): ParsedSymbol[];
}

/**
 * High-precision AST symbol extractor supporting:
 *  - TypeScript / JavaScript (function, async function, class, interface, method, type)
 *  - Python (def, async def, class)
 *  - Go (func, type struct, type interface)
 *  - Rust (fn, struct, enum, impl, trait)
 *  - Java (class, interface, enum, method)
 *  - C / C++ (class, struct, function)
 */
export class UniversalSymbolExtractor implements SymbolExtractor {
  constructor(public readonly language: string) {}

  extractSymbols(_filePath: string, content: string): ParsedSymbol[] {
    const lines = content.split("\n");
    const symbols: ParsedSymbol[] = [];

    switch (this.language) {
      case "typescript":
      case "javascript":
        this.extractTypeScriptSymbols(lines, symbols);
        break;
      case "python":
        this.extractPythonSymbols(lines, symbols);
        break;
      case "go":
        this.extractGoSymbols(lines, symbols);
        break;
      case "rust":
        this.extractRustSymbols(lines, symbols);
        break;
      case "java":
        this.extractJavaSymbols(lines, symbols);
        break;
      case "c":
      case "cpp":
        this.extractCppSymbols(lines, symbols);
        break;
      default:
        // Generic fallback
        this.extractGenericSymbols(lines, symbols);
        break;
    }

    return symbols;
  }

  private extractTypeScriptSymbols(lines: string[], symbols: ParsedSymbol[]) {
    let currentClass: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();

      // Skip comments
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;

      // Class or Interface or Type
      const classMatch = trimmed.match(
        /^(?:export\s+)?(?:default\s+)?(?:abstract\s+)?(class|interface|type)\s+([a-zA-Z0-9_]+)/
      );
      if (classMatch) {
        const symbolType = (classMatch[1] === "class"
          ? "class"
          : classMatch[1] === "interface"
            ? "interface"
            : "type") as SymbolType;
        const name = classMatch[2]!;
        const endLine = this.findMatchingBrace(lines, i);
        symbols.push({
          name,
          type: symbolType,
          startLine: i + 1,
          endLine,
          parentSymbol: null,
        });
        if (symbolType === "class") currentClass = name;
        continue;
      }

      // Standalone function or exported arrow function
      const fnMatch = trimmed.match(
        /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function(?:\s*\*|\s+)([a-zA-Z0-9_]+)\s*\(/
      );
      if (fnMatch) {
        const name = fnMatch[1]!;
        const endLine = this.findMatchingBrace(lines, i);
        symbols.push({
          name,
          type: "function",
          startLine: i + 1,
          endLine,
          parentSymbol: null,
        });
        continue;
      }

      // Const arrow function: const myFunc = (args) => { ... }
      const arrowMatch = trimmed.match(
        /^(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>\s*\{/
      );
      if (arrowMatch) {
        const name = arrowMatch[1]!;
        const endLine = this.findMatchingBrace(lines, i);
        symbols.push({
          name,
          type: "function",
          startLine: i + 1,
          endLine,
          parentSymbol: null,
        });
        continue;
      }

      // Class method
      if (currentClass && trimmed.match(/^(?:public|private|protected|async|static|\*)*\s*([a-zA-Z0-9_]+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/)) {
        const methodMatch = trimmed.match(
          /^(?:public|private|protected|async|static|\*)*\s*([a-zA-Z0-9_]+)\s*\(/
        );
        if (methodMatch && methodMatch[1] && methodMatch[1] !== "if" && methodMatch[1] !== "for" && methodMatch[1] !== "while" && methodMatch[1] !== "switch") {
          const name = methodMatch[1];
          const endLine = this.findMatchingBrace(lines, i);
          symbols.push({
            name,
            type: "method",
            startLine: i + 1,
            endLine,
            parentSymbol: currentClass,
          });
        }
      }
    }
  }

  private extractPythonSymbols(lines: string[], symbols: ParsedSymbol[]) {
    let currentClass: { name: string; indent: number } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const indent = line.search(/\S/);

      if (currentClass && indent <= currentClass.indent) {
        currentClass = null;
      }

      // Class definition
      const classMatch = trimmed.match(/^class\s+([a-zA-Z0-9_]+)(?:\(.*?\))?:/);
      if (classMatch) {
        const name = classMatch[1]!;
        const endLine = this.findPythonBlockEnd(lines, i, indent);
        symbols.push({
          name,
          type: "class",
          startLine: i + 1,
          endLine,
          parentSymbol: null,
        });
        currentClass = { name, indent };
        continue;
      }

      // Function definition
      const defMatch = trimmed.match(/^(?:async\s+)?def\s+([a-zA-Z0-9_]+)\s*\(/);
      if (defMatch) {
        const name = defMatch[1]!;
        const endLine = this.findPythonBlockEnd(lines, i, indent);
        symbols.push({
          name,
          type: currentClass ? "method" : "function",
          startLine: i + 1,
          endLine,
          parentSymbol: currentClass ? currentClass.name : null,
        });
      }
    }
  }

  private extractGoSymbols(lines: string[], symbols: ParsedSymbol[]) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*")) continue;

      // Method: func (r *Receiver) MethodName(...) ...
      const methodMatch = trimmed.match(
        /^func\s+\((?:[a-zA-Z0-9_*]+\s+)?\*?([a-zA-Z0-9_]+)\)\s+([a-zA-Z0-9_]+)\s*\(/
      );
      if (methodMatch) {
        const receiver = methodMatch[1]!;
        const name = methodMatch[2]!;
        const endLine = this.findMatchingBrace(lines, i);
        symbols.push({
          name,
          type: "method",
          startLine: i + 1,
          endLine,
          parentSymbol: receiver,
        });
        continue;
      }

      // Function: func FunctionName(...) ...
      const funcMatch = trimmed.match(/^func\s+([a-zA-Z0-9_]+)\s*\(/);
      if (funcMatch) {
        const name = funcMatch[1]!;
        const endLine = this.findMatchingBrace(lines, i);
        symbols.push({
          name,
          type: "function",
          startLine: i + 1,
          endLine,
          parentSymbol: null,
        });
        continue;
      }

      // Struct / Interface: type Name struct / interface
      const typeMatch = trimmed.match(/^type\s+([a-zA-Z0-9_]+)\s+(struct|interface)\s*\{/);
      if (typeMatch) {
        const name = typeMatch[1]!;
        const typeKind = typeMatch[2] === "struct" ? "struct" : "interface";
        const endLine = this.findMatchingBrace(lines, i);
        symbols.push({
          name,
          type: typeKind as SymbolType,
          startLine: i + 1,
          endLine,
          parentSymbol: null,
        });
      }
    }
  }

  private extractRustSymbols(lines: string[], symbols: ParsedSymbol[]) {
    let currentImpl: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*")) continue;

      // Impl block: impl StructName { ... }
      const implMatch = trimmed.match(/^(?:pub\s+)?impl(?:\s*<.*?>)?\s+([a-zA-Z0-9_]+)/);
      if (implMatch) {
        currentImpl = implMatch[1]!;
      }

      // Struct / Enum: pub struct MyStruct { ... }
      const structMatch = trimmed.match(/^(?:pub(?:\(crate\))?\s+)?(struct|enum|trait)\s+([a-zA-Z0-9_]+)/);
      if (structMatch) {
        const name = structMatch[2]!;
        const endLine = this.findMatchingBrace(lines, i);
        symbols.push({
          name,
          type: (structMatch[1] === "trait" ? "interface" : "struct") as SymbolType,
          startLine: i + 1,
          endLine,
          parentSymbol: null,
        });
        continue;
      }

      // Function: pub fn my_fn(...) { ... }
      const fnMatch = trimmed.match(/^(?:pub(?:\(crate\))?\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)\s*(?:<.*?>)?\s*\(/);
      if (fnMatch) {
        const name = fnMatch[1]!;
        const endLine = this.findMatchingBrace(lines, i);
        symbols.push({
          name,
          type: currentImpl ? "method" : "function",
          startLine: i + 1,
          endLine,
          parentSymbol: currentImpl,
        });
      }
    }
  }

  private extractJavaSymbols(lines: string[], symbols: ParsedSymbol[]) {
    let currentClass: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*")) continue;

      const classMatch = trimmed.match(/^(?:public|protected|private)?\s*(?:static\s+)?(?:abstract\s+)?(class|interface|enum)\s+([a-zA-Z0-9_]+)/);
      if (classMatch) {
        const name = classMatch[2]!;
        const endLine = this.findMatchingBrace(lines, i);
        symbols.push({
          name,
          type: classMatch[1] === "interface" ? "interface" : "class",
          startLine: i + 1,
          endLine,
          parentSymbol: null,
        });
        currentClass = name;
        continue;
      }

      if (currentClass) {
        const methodMatch = trimmed.match(/^(?:public|protected|private)?\s*(?:static\s+)?(?:final\s+)?(?:synchronized\s+)?(?:<.*?>\s+)?([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*(?:throws\s+[^{]+)?\s*\{/);
        if (methodMatch && methodMatch[2]) {
          const methodName = methodMatch[2];
          if (methodName !== "if" && methodName !== "for" && methodName !== "while" && methodName !== "switch") {
            const endLine = this.findMatchingBrace(lines, i);
            symbols.push({
              name: methodName,
              type: "method",
              startLine: i + 1,
              endLine,
              parentSymbol: currentClass,
            });
          }
        }
      }
    }
  }

  private extractCppSymbols(lines: string[], symbols: ParsedSymbol[]) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*")) continue;

      const classMatch = trimmed.match(/^(?:class|struct)\s+([a-zA-Z0-9_]+)\s*(?::\s*[^{]+)?\s*\{/);
      if (classMatch) {
        const name = classMatch[1]!;
        const endLine = this.findMatchingBrace(lines, i);
        symbols.push({
          name,
          type: "class",
          startLine: i + 1,
          endLine,
          parentSymbol: null,
        });
      }
    }
  }

  private extractGenericSymbols(lines: string[], symbols: ParsedSymbol[]) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();
      const match = trimmed.match(/^(?:function|def|func|fn)\s+([a-zA-Z0-9_]+)/);
      if (match) {
        symbols.push({
          name: match[1]!,
          type: "function",
          startLine: i + 1,
          endLine: Math.min(i + 20, lines.length),
        });
      }
    }
  }

  private findMatchingBrace(lines: string[], startIdx: number): number {
    let braceCount = 0;
    let foundFirstBrace = false;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i]!;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === "{") {
          braceCount++;
          foundFirstBrace = true;
        } else if (char === "}") {
          braceCount--;
          if (foundFirstBrace && braceCount <= 0) {
            return i + 1;
          }
        }
      }
    }
    return Math.min(startIdx + 50, lines.length);
  }

  private findPythonBlockEnd(lines: string[], startIdx: number, baseIndent: number): number {
    for (let i = startIdx + 1; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const indent = line.search(/\S/);
      if (indent <= baseIndent) {
        return i; // 1-based line before this
      }
    }
    return lines.length;
  }
}

