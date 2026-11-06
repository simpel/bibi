# 0030 – Search indexing stays in-process and failure-safe

- **Date:** 2026-10-15
- **Status:** Accepted
- **Related:** 0008, 0027

## Context
- ADR 0008 says embeddings are asynchronous, idempotent and failure-safe. In practice the indexing hook runs after commit, in-process.
- An embedding error reached the catch in `execute`, so a command that had already committed was reported as failed.
- Indexing is idempotent through a content hash, and a reindex command exists. pg-boss (ADR 0027) would allow a queue.

## Decision
1. Keep indexing in-process after commit. Move it to a pg-boss job only if volume or latency requires it.
2. The hook is failure-safe: an embedding error never changes the result of a committed command. It is logged as `search.index_failed` and reindex repairs the row, for failed updates as well as creates.

## Rejected
- A queue now: no volume or latency need yet, and it adds a moving part.

## Consequences
- "Asynchronous" in ADR 0008 means after commit and non-blocking for the outcome, not a queue.
- The upgrade path is a pg-boss job calling the same indexing function, with no contract change.
