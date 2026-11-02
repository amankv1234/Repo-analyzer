# ADR-0004: Provider Abstraction for LLM and Embedding Services

## Status
Accepted

## Context
AI model capabilities, pricing, context window limits, and embedding performance evolve rapidly. Tightly coupling our domain code to vendor SDKs (such as Anthropic, OpenAI, or Voyage AI) creates severe vendor lock-in, complicates unit testing, and prevents local offline fallbacks during testing or air-gapped development.

## Decision
We defined clean TypeScript provider interfaces in `packages/core`:
- `LLMProvider`: Methods `complete(prompt, options)` and `stream(prompt, options)`. Default implementation: `AnthropicClaudeProvider` using `@anthropic-ai/sdk` (Claude 3.5 Sonnet / Haiku).
- `EmbeddingProvider`: Method `embedBatch(texts)`. Default implementation: `VoyageAIEmbeddingProvider` using `voyage-code-2` / `voyage-3`; fallback implementation: `LocalTransformerEmbeddingProvider` using `@xenova/transformers`.

Selection of active providers is configured dynamically via environment variables (`LLM_PROVIDER`, `EMBEDDING_PROVIDER`).

## Consequences
### Positive:
- **Testability**: Unit and integration tests mock `LLMProvider` and `EmbeddingProvider` with deterministic in-memory fixtures without incurring API costs or network latency.
- **Flexibility**: We can seamlessly switch to local models (e.g., HuggingFace embeddings or Ollama) by changing an environment variable.
- **Portability**: Core domain services interact with clean interfaces, keeping `packages/core` free of third-party SDK dependencies.

### Negative:
- Slightly higher initial boilerplate defining provider interfaces and DTOs.

