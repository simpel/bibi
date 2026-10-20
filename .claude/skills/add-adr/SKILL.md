---
name: add-adr
description: Write a new decision record (ADR) in `docs/decisions/NNNN-title.md`, in English. Use when an architecture or product decision should be logged or changed.
---

# New ADR

1. **Number:** highest `NNNN` + 1, taken across `docs/decisions/`, other branches and worktrees (`git worktree list`, `git branch -a`, `git log --all --name-only --pretty= -- docs/decisions | sort -u | tail`), so two ADRs never share a number. Filename `NNNN-short-title.md` (lowercase, hyphens). English.
2. **Structure** (see `0059-capabilities-demands-and-buffers.md` for a full one):
   ```
   # NNNN – Title

   - **Date:** YYYY-MM-DD
   - **Status:** Proposed | Accepted | Superseded by NNNN
   - **Related:** ADRs it amends, supersedes or builds on

   ## Context
   ## Decision
   ## Consequences
   ## Alternatives rejected
   ```
3. **Context states what was checked.** Say what you read in code and when. An ADR describes intent, not fact: ADR 0021 described a bundle expansion that was never built. Verify a claim before building on it.
4. **Decision:** numbered, grouped by topic, short bullets. If it adds or changes data, include a table that classifies every column as owned, derived, projection or snapshot (ADR 0051). Name the surfaces (web, GraphQL, REST, MCP), the permission and the seed change.
5. **Status:** write it as `Proposed`. Set `Accepted` only when the user says so; ask, do not read "ok" as acceptance.
6. **Older ADRs:** if the decision replaces one, set the old one to "Superseded by NNNN". If it only extends or amends one, add a dated "Addendum" at its end (as in 0010): `## Addendum YYYY-MM-DD – topic` with a one-line pointer `(ADR NNNN)`, and add it to this ADR's `Related`.
7. **When it is accepted, follow through in the same change:**
   - `CLAUDE.md`: a short pointer only if it changes the stack, a principle or the open questions. Mark anything not built as "accepted, not built yet" with the issue that builds it.
   - `docs/domain-model.md` and `docs/artifacts/domain-model.html` together: a **Target (ADR NNNN)** note on each entity it changes.
   - The board: create the issues with the `new-ticket` skill, in dependency order, each with Kind, Size, Priority, a Seed data section and Depends on. A rename or other large mechanical change is a `Codemod` ticket with a Renames table and lands first. Create the `adr:NNNN` label, and add it only to tickets that edit the same code (the run batches one ticket per ADR label).
   - Close the `type:decision` ticket that tracked the acceptance.
