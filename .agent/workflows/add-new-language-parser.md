# Workflow: Add a New Language Parser (web-tree-sitter)

Follow these numbered steps sequentially when adding support for a new programming language in RepoMentor.

---

## Step 1: Obtain the Precompiled Tree-Sitter WASM Grammar
1. Download or compile the official tree-sitter WASM grammar for the target language (e.g., `tree-sitter-python.wasm`, `tree-sitter-go.wasm`, `tree-sitter-rust.wasm`).
2. Place the WASM binary under `packages/core/grammars/tree-sitter-<language>.wasm`.
3. Add the file to package asset tracking and ensure it is copied to build outputs.

---

## Step 2: Implement Tree-Sitter Query & AST Mapping
1. Navigate to `packages/core/src/parser/languages/`.
2. Create `<language>.parser.ts` implementing `LanguageASTParser`:
   - Map file extensions to this parser (e.g., `.rs` -> Rust).
   - Define Tree-Sitter S-expression queries (`.scm`) to capture symbols:
     - Function declarations (`(function_item name: (identifier) @symbol.name) @symbol.body`)
     - Struct/Class declarations (`(struct_item name: (type_identifier) @symbol.name) @symbol.body`)
     - Impl blocks / Methods (`(impl_item) @symbol.body`)
3. Return normalized `ParsedSymbol` structures containing:
   - `symbolName`: Identifier name
   - `symbolType`: `function` | `class` | `interface` | `type`
   - `startLine`: 1-based start line
   - `endLine`: 1-based end line
   - `content`: Extracted source text

---

## Step 3: Register Parser in LanguageRegistry
1. Open `packages/core/src/parser/language-registry.ts`.
2. Register the language identifier, file extensions, and parser factory.
3. Handle graceful fallback: if WASM loading fails for an obscure language, fallback to structural line/indentation chunking.

---

## Step 4: Write Unit Tests with Real Code Snippets
1. Create `packages/core/tests/parser/<language>-parser.spec.ts`.
2. Provide representative source code snippets for the language (nested functions, multiline classes, comments).
3. Assert that all symbols are parsed accurately with exact line boundaries.

---

## Step 5: Test Ingestion Pipeline Integration
1. Run `pnpm --filter @repomentor/core test`.
2. Verify end-to-end chunking with a test file containing the new language.

