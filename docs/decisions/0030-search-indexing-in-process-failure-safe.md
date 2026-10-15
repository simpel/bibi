# 0030 – Search indexing stays in-process and failure-safe

- **Date:** 2026-10-15
- **Status:** Accepted

## Context
- ADR 0008 says embeddings are computed asynchronously, idempotently and failure-safe. In practice `createIndexingHook` runs after commit, in-process.
- An embedding error reaches the catch in `execute`, so a command that already committed is reported as failed (issue #11).
- Indexing is idempotent via `contentHash`, and a reindex CLI exists.
- ADR 0027 provides pg-boss, so a queue is possible.

## Decision
- **Keep indexing in-process.** Move it to a pg-boss job only if volume or latency requires it.
- **The hook is failure-safe:** an embedding error never changes the result of a committed command. It is logged as `search.index_failed` and the row is picked up by reindex.
- Test: the command succeeds when the embedder throws, and reindex indexes the row afterwards.

## Consequences
- ADR 0008 is updated: "asynchronous" means after commit and non-blocking for the outcome, not a queue.
- The upgrade path is a pg-boss job calling the same indexing function. No contract changes.
- Implementation stays in #11.
