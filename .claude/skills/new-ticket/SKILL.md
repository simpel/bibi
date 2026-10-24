---
name: new-ticket
description: Create a ticket on the bibi board (project 8) with Status, Priority, Size and Kind, a Seed data section and Depends on. Use whenever work needs an issue, including follow-ups found while implementing and the tickets that come out of an ADR.
---

# New ticket

A ticket says what to build and how to know it is done, so `implement-ticket` can do it without asking.

1. **Check for a duplicate:** `gh issue list -R simpel/bibi --state all --search "<keywords>"`. Update an existing issue instead of creating a second one.
2. **Set the board fields:**
   - **Kind:** `Feature` (default), `Bugfix` (a failing test comes first), `Tech debt` (no behaviour change), `Test` (tests only), `Docs` (docs only) or `Codemod` (a scripted rename or move). A `type:decision` label means the outcome is a Proposed ADR.
   - **Size:** `XS` to `XL`.
   - **Priority:** `P0` to `P2`.
3. **Write the body** with these sections, in this order:
   - `### Background`: why, the source ADR and its spec, "Found while working on #N" for follow-ups.
   - `### To do`: checkboxes, one coherent step each.
   - `### Seed data`: the files in `packages/core/src/seed/demo/` and `docs/demo-seed.md` that change, or "No seed change" with the reason. Required for `Feature` and `Codemod`.
   - `### Depends on`: one `- #N` line per blocker; `tools/backlog/select.mjs` reads this section, so keep it exact. Add a blocker whenever the work needs another ticket's code.
   - `### Done when`: an observable outcome.
   - `### Renames` (required for `Codemod`): a table with the old names in the first column, each in backticks, then the new name.
4. **Labels:** `type:*` and `area:*` from the paths, `adr:NNNN` when an ADR is the source.
5. **Create it** with the helper, never with bare `gh issue create` (it validates the board options and the required sections, and adds the issue to the board):
   ```bash
   node tools/backlog/ticket.mjs create --spec spec.json --dry-run
   node tools/backlog/ticket.mjs create --spec spec.json
   ```
   `spec.json`: `{ "title", "body", "labels": [], "priority": "P1", "size": "M", "kind": "Feature" }`. Status defaults to `Backlog`.
6. **Change fields later:** `node tools/backlog/ticket.mjs set <number[,number...]> --status Todo --size L`.
7. **Move to `Todo` only when it can start:** its blockers are done and its ADR is accepted. The issue title becomes the commit summary on `main`, so write it as a clear summary without a type prefix.
8. **Tell the user** the issue numbers, and link them from any plan or ADR that spawned them.
