# tools/backlog – context for Claude

The board (https://github.com/users/simpel/projects/8, kanban, not project 7) and its two helpers. Work flows through two skills: `new-ticket` creates a ticket, `implement-ticket` builds it and commits straight to `main` (ADR 0070).

- Every piece of work has an issue. Create it with the `new-ticket` skill (`node tools/backlog/ticket.mjs create`), which adds it to the board with Status, Priority (P0–P2), Size (XS–XL) and Kind (Feature, Bugfix, Codemod, Tech debt, Docs, Test).
- Board states: `Backlog` → `Todo` (it can start: blockers done, ADR accepted) → `In progress` → `Done`. Change them with `node tools/backlog/ticket.mjs set <N> --status <Status>`, never by looking up field ids with `gh project field-list`.
- `node tools/backlog/select.mjs` lists open `Todo` tickets with their fields and `openBlockers` (the body's `### Depends on` plus GitHub's blocked-by).
- A commit closes its issue with `Closes #N`. Comment on the issue when work is split up or abandoned.
- Every ticket that adds or changes data or behaviour has a **Seed data** section, or "No seed change" with the reason. It is not done until `seed:demo` runs from an empty database with green checks.
- `gh` needs the `project` scope (`gh auth refresh -s project`).
