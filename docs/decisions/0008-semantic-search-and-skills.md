# 0008 – Semantic search and skills

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
Users and the assistant need to find entities (venues, rooms and later bookings) by free text and meaning, not only exact names. At the same time, AI behavior, for example how a quote is put together, is reused in many contexts. Ad hoc prompts in code are hard to maintain and share.

## Decision
### Semantic search
- pgvector in the same Postgres as the rest of the data.
- Hybrid search: full-text search (FTS) combined with vector search.
- Everything is org-scoped.
- Generic `Embeddable` interface for entities that want to be searchable. Embeddings are computed in an asynchronous job when an entity is created or changed.
- The core operation `search` is exposed on all surfaces (ADR 0003).
- `Venue` and `Room` come first.
- The embedding model is chosen in configuration. The choice has not been made yet (see CLAUDE.md, open questions).

### Skills
- Skills follow the Agent Skills style: name, description, markdown instructions, allowed tools and optional resources.
- Three scopes:
  - System: shipped in the repo, versioned and seeded.
  - Organization: created and used by an organization.
  - Personal: tied to a user.
- A personal skill can be shared with the organization. An organization can publish a skill.
- Export and import of `SKILL.md`.
- The assistant loads skills on demand through the tools `list_skill` and `load_skill`.
- Skills are core operations (create, read, share, import, export) and `Embeddable` for search.
- A marketplace between organizations is postponed and requires its own ADR.

## Consequences
- Search and skills follow the same parity and scoping rules as other data.
- Embeddings cost something on create and update. The job must be idempotent and tolerate failure.
- Hybrid search requires us to test relevance on real examples, not only that the code works.
- System skills are versioned in the repo. Changes to them are code changes and are reviewed as such.
- Importing skills from external files is a security risk. The content is treated as data and tool permissions are limited by the skill's `allowed tools`.

## Addenda (current behaviour is in `packages/core/CLAUDE.md`, "AI data layer" and "Search")
- 2026-10-13: SYSTEM skills are global rows (`organizationId = null`) that only the seeder writes; a personal skill is shared by copying it to the organization as a draft (admin only). The MCP tools are `skill_list` and `skill_get`. Search filters hits per user and conversations are private to the owner.
- 2026-10-14: `Room` is replaced by `Item` with the `BOOKABLE` capability (ADR 0021).
- 2026-10-15: "asynchronous" means an in-process `afterCommit` hook, not a queue (ADR 0030). An indexing error never changes the command's result; it logs `search.index_failed`, and `pnpm --filter @okazi/ai reindex` repairs missing or stale rows idempotently.
