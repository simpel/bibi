# tools/backlog – context for Claude

The board (https://github.com/users/simpel/projects/8, kanban, not project 7) and the scripts the ticket loop (`tools/loop/`) runs.

## Issues and board
- Every piece of work has an issue. If none exists, create it with the `new-ticket` skill (`node tools/backlog/ticket.mjs create`), which adds it to the board and sets Status, Priority (P0–P2), Size (XS–XL) and Kind (Feature, Bugfix, Codemod, Tech debt, Docs, Test), plus Model (Auto, Haiku, Sonnet, Opus) and Effort (Auto, Low, Medium, High, Extra) when you know better. The creator decides how the work is run; the loop follows the fields.
- Move the card when the work changes state: `Backlog` → `Todo` → `In progress` when work starts → `Done` when merged. `Parked` = the loop could not land the work and pushed it to a `parked/<issues>` branch (linked in the issue comment); fix it there or move the card back to `Todo`. Update with `node tools/backlog/ticket.mjs set <N> --status <Status>`.
- PRs link the issue with `Closes #NN`. Comment on the issue with what was done if the work is split up or abandoned.
- Every ticket that adds or changes data or behaviour has a **Seed data** section: which files in `packages/core/src/seed/demo/` (data, `seed-*.ts`, `checks.ts`, `reset.ts`) and `docs/demo-seed.md` change, or an explicit "No seed change" with the reason. A ticket is not done until `seed:demo` runs from an empty database with green checks.
- `gh` needs the `project` scope (`gh auth refresh -s project`).

## Ticket loop (`tools/loop/`, ADR 0066)
- `tools/loop/run.sh --slot <k>` picks ready `Todo` tickets and opens one PR per ticket. It never merges, and it never picks a `source:agent` ticket until a human moves it to `Todo`. Rules and usage: `tools/loop/CLAUDE.md`.
- Scripts here are shared with the loop: `select.mjs` (board read), `prep.sh` (a `t-<N>` worktree for one ticket), `checks.sh`, `ship.sh` (commit `<type>: <issue title>` with `Closes #N`, PR), `park.sh` (push to `parked/<N>`, comment, card to `Parked`), `main-ci.sh`, `ci.sh`, `residue.sh`, `release.sh`, `ticket.mjs` (create tickets). Board ids live in `board.env`, never looked up with `gh project field-list`.
- `TICKET_DIR` points `ship.sh` and `park.sh` at a slot worktree. `KEEP_WORKTREE=1` makes `park.sh` keep it.
- **Metrics:** every loop ticket appends one line to `bibi-worktrees/.metrics/runs.jsonl` (`metrics.mjs record --path loop`: cost, input and cache-read tokens). `node tools/backlog/metrics.mjs report` joins it with GitHub. The 2026-10-22 workflow run is the baseline (ADR 0066 has its token figures).

## Tests
- `bash tools/backlog/scripts-smoke.sh` and `node --test tools/backlog/metrics.test.mjs tools/loop/loop.test.mjs` test the scripts and the loop rules without GitHub.
