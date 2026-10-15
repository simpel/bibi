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

## Addendum 2026-10-13 – implementation of the AI data layer
- SYSTEM skills are stored with `organizationId = null`. The org-scoped client lets all organizations read them but never write them. Only the seeder (`seedSystemSkills`) writes them, with the unscoped client. CHECK constraints in the database bind scope to organization and owner.
- A personal skill is shared by being copied to the organization as a draft (`skill.share`, requires admin). The original stays. A member who wants to share needs an admin (or export and import).
- The tools are named `skill_list` and `skill_get` in MCP (operation names use `_`). `list_skill` and `load_skill` in the decision above become aliases or wrappers in `packages/ai`.
- Search filters hits per user: personal skills and conversations are visible only to the owner. SYSTEM skills are indexed once globally and are part of every organization's search.
- Conversations (ADR 0007) are private to the owner. An org admin may read, but not write, for oversight.

## Addendum 2026-10-14
- `Room` is replaced by `Item` with the behavior `BOOKABLE` (ADR 0021). `Venue` and `Item` come first as searchable entities.

## Addendum 2026-10-15
- "Asynchronous" means after commit and non-blocking for the command's outcome, not a queue. See 0030.
