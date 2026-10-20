---
name: new-ticket
description: Create a ticket on the okazi board (project 8) with every required field (Status, Priority, Size, Kind, optional Model), a Seed data section and Depends on. Use whenever work needs an issue, including follow-ups and the tickets that come out of an ADR.
---

# New ticket

The ticket creator knows the scope, so the creator decides how the work is run. The `work-backlog` workflow follows the board fields, falls back to its own defaults when they are empty, and says so in its log when they look contradictory.

1. **Check for a duplicate:** `gh issue list -R simpel/okazi --state all --search "<keywords>"`. Update an existing issue instead of creating a second one.
2. **Decide the execution profile** (board fields, one value each):
   - **Kind** picks the path the run takes:
     - `Feature` (default): the `new-feature` skill; implement, fix, tenancy review, pull request.
     - `Bugfix` (`fix-bug` skill): reproduce first. The agent writes a failing test, then fixes; a ticket without that proof is sent back.
     - `Tech debt` (`refactor` skill): behaviour-preserving. Existing tests must pass unmodified.
     - `Test` (`add-tests` skill): tests only. A production file in the change is sent back.
     - `Docs` (`write-docs` skill): documentation only, and only lint and check:structure run. A code file in the change is sent back.
     - `Codemod` (`codemod` skill): a mechanical change done with scripts (a rename, a move). Runs alone, on Sonnet, with 3 fix rounds, and a script checks that no old name is left.
     - A `type:decision` label (with any Kind) makes it a decision ticket (`add-adr` skill): the agent drafts a Proposed ADR and opens a PR that a person accepts. The run never merges it.
   - **Size:** `XS` to `XL`. `XL` runs alone. `L` and `XL` default to Opus.
   - **Priority:** `P0` to `P2`.
   - **Model:** leave `Auto` unless you know better. `Haiku` for scripted or clearly specified work (docs, i18n strings, boilerplate), never open-ended implementation (it measured ~93 turns per ticket against Sonnet's ~19). `Sonnet` for ordinary and mechanical work. `Opus` where a mistake is expensive (tenancy, auth, trigger SQL, migrations with logic). A ticket cannot be two models.
   - **Effort:** how hard the implementing agent thinks. Leave `Auto`: Docs is Low, a codemod is Medium, Opus, L/XL and risky areas are High, everything else Medium. Set `High` or `Extra` for a ticket whose difficulty is in the reasoning (a subtle concurrency bug, a hard design), `Low` for trivial work. Extra is never a default. The last fix round raises effort one step.
3. **Write the body** with these sections, in this order:
   - `### Background`: why, the source ADR and its spec, "Found by an agent while working on #N" for follow-ups.
   - `### To do`: checkboxes, one coherent step each.
   - `### Seed data`: the files in `packages/core/src/seed/demo/` and `docs/demo-seed.md` that change, or "No seed change" with the reason. Required for `Feature` and `Codemod`.
   - `### Depends on`: one `- #N` line per blocker. `tools/backlog/select.mjs` reads this section, so keep it exact.
   - `### Done when`: observable outcome, plus the gates line (`pnpm lint`, `check:structure`, `typecheck`, `test`).
   - `### Execution` (optional): why this Kind or Model, the risky spots (for example `sync_line_occupancy.sql`).
   - `### Renames` (required for `Codemod`): a table with the old names in the first column, each in backticks (text in parentheses is ignored), then the new name and the kind (identifier, Prisma, string, file, SQL). The codemod works from it and the residue gate searches for every old name. A plain lowercase word matches as a whole word, an identifier or file name as a substring.
4. **Labels:** `type:*` and `area:*` from the paths. An `adr:NNNN` label links the ticket to its ADR, and `work-backlog` runs tickets with the same ADR label one per batch, so add it only to tickets that edit the same code.
5. **Create it** with the helper, never with bare `gh issue create` (it validates the board options, the Seed data and Renames sections, and handles the project auto-add):
   ```bash
   node tools/backlog/ticket.mjs create --spec spec.json --dry-run
   node tools/backlog/ticket.mjs create --spec spec.json
   ```
   `spec.json`: `{ "title", "body", "labels": [], "priority": "P1", "size": "M", "kind": "Feature", "model": "Auto", "effort": "Auto" }`. Status defaults to `Backlog`.
6. **Change fields later:** `node tools/backlog/ticket.mjs set <number[,number...]> --status Todo --size L --model Opus --effort High`.
7. **Move to `Todo` only when it can start:** its blockers are done and its ADR is accepted. `source:agent` tickets are never picked by the run until a human moves them. Every ticket the run finishes becomes a pull request that is squash-merged when CI is green (a decision ticket's PR stays open), so the title you give the issue becomes the commit line on `main`: write it as a clear summary.
8. **Tell the user** the issue numbers, and link them from any plan or ADR that spawned them.
