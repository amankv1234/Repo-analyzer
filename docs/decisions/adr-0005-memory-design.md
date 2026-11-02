# ADR-0005: 3-Tier Hierarchical Memory System Design

## Status
Accepted

## Context
Standard RAG chat systems operate without long-term continuity: each session begins tabula rasa. In repository onboarding, a developer explores a codebase across multiple sessions spanning days or weeks. Without memory, the AI repeatedly explains foundational concepts the developer already understands, forgets which files have been modified or inspected, and fails to retain the developer's high-level feature objectives.

## Decision
We implemented a **3-Tier Hierarchical Memory Architecture**:
1. **Layer 1 (Short-Term Window)**: The most recent 6-10 conversational turns stored verbatim.
2. **Layer 2 (Repository Knowledge State)**: The synthesized 7-part onboarding overview and file tree summary.
3. **Layer 3 (Long-Term Episodic Memory)**: A continuously updated, structured natural language distillation scoped to `(user_id, repo_id)` summarizing user goals, mastered concepts, traversed files, and coding preferences. Summarization occurs asynchronously every $N$ turns via background worker jobs.

## Consequences
### Positive:
- **Continuous Context**: The assistant remembers user goals across days and sessions without the user having to re-explain context.
- **Token Efficiency**: Compacting multi-turn dialogues into a 1,500-token summary drastically reduces prompt token bloat while preserving critical semantic context.
- **Zero Latency Impact**: Memory summarization runs asynchronously in background queues without delaying chat stream responses.

### Negative:
- Asynchronous summarization means memory updates lag slightly behind the active stream until the background summarizer completes.

