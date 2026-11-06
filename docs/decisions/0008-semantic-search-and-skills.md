# 0008 – Semantic search and skills

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
- Users and the assistant must find entities by meaning, not only exact names.
- Reusable AI behaviour in ad hoc prompts is hard to maintain and share.

## Decision
1. Semantic search uses pgvector in the same Postgres. Search is hybrid: full-text plus vector, always org-scoped.
2. Entities opt in through a generic `Embeddable` interface. Embeddings are computed after commit in-process, not in a queue (ADR 0030). An indexing error never changes the command's result; a reindex job repairs gaps idempotently.
3. `search` is a core operation on every surface (ADR 0003). Hits are filtered per user.
4. Skills follow the Agent Skills style: name, description, markdown instructions, allowed tools.
5. Skills have three scopes: System (global rows, written only by the seeder), Organization and Personal. A personal skill is shared by copying it to the organization as a draft, admin only.
6. The assistant loads skills on demand through MCP tools. Skills are core operations and `Embeddable`.
7. A marketplace between organizations is postponed and needs its own ADR.

## Rejected
- A separate vector database: a second system to run, scope and keep consistent.
- Ad hoc prompts in code instead of skills.

## Consequences
- Search and skills follow the same parity and scoping rules as other data.
- Embeddings cost on every create and update; hybrid relevance must be tested on real examples.
- Imported skill files are untrusted. Content is data and tool access is limited by `allowed tools`.
- System skills are versioned in the repo, so changing them is a code change.
