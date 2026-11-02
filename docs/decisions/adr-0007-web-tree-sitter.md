# ADR-0007: Multi-Language Code Parsing via web-tree-sitter (WASM)

## Status
Accepted

## Context
Accurate code chunking requires parsing Abstract Syntax Trees across multiple languages (TypeScript, JavaScript, Python, Go, Rust). Native tree-sitter bindings (`tree-sitter` npm package) rely on native C/C++ compilation via `node-gyp`, requiring host-level C++ compilers, Python, and OS-specific toolchains. This creates brittle Docker builds, cross-platform compilation failures (especially on Windows and Alpine Linux), and potential security risks if native libraries crash.

## Decision
We chose **`web-tree-sitter`**, the official WebAssembly (WASM) build of Tree-Sitter, paired with precompiled language WASM grammars.

## Consequences
### Positive:
- **100% Platform Portability**: WASM grammars run identically on macOS, Linux, Windows, Docker, and CI without requiring C++ build tools or `node-gyp`.
- **Security Sandboxing**: The WASM runtime executes within the V8 WebAssembly sandbox, isolating untrusted code parsing from the host operating system.
- **Multi-Language Consistency**: Provides a uniform S-expression query interface (`(function_declaration) @symbol`) across all target programming languages.

### Negative:
- Slightly higher initialization time to load the WASM module into memory on worker boot (typically 10-20ms per grammar), which is easily mitigated by singleton caching.

