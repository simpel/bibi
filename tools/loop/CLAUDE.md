# tools/loop – context for Claude

The ticket loop: picks ready `Todo` tickets from board 8 and delivers each as one pull request. Joel merges by hand. Why: ADR 0066.

## Running it
- `tools/loop/run.sh --slot 1` in a terminal tab from the main checkout. Add a second tab with `--slot 2` for parallel work. `--once` stops after one ticket. `--dry-run` prints the pick and changes nothing.
- Stop it with Ctrl-C. A claim left by a stopped slot is cleared when that slot starts again.
- Settings (budgets, sleep, review paths, tools) live in `config.sh`. Model, effort, skill and dollar cap per ticket come from `model.mjs`.
- `node tools/backlog/metrics.mjs report` shows the cost per ticket. Each session's output is in `../bibi-worktrees/.loop/runs/<N>-<time>/`.

## Rules
- Never put a model around a step a script can do. A new deterministic step is a script here or in `tools/backlog/`.
- Sessions never push, merge or call `gh`. Only `ship.sh`, `park.sh` and `rescue.sh` touch GitHub.
- Keep the session's tool list and allowlist short (`LOOP_TOOLS`, `LOOP_ALLOWED`). Every tool adds to every turn's context.
- A fix goes back into the same session (`--resume`), never into a new one.
- Checks take turns: `tools/backlog/checks.sh` holds a machine-wide lock (`checks-lock.sh`) while the tests run, because parallel test runs on the shared Postgres time out. Never bypass it to save time.
- Reset a slot's databases with `prep-slot.sh`, never with a plain migrate: an unmerged migration from the slot's last ticket must not survive.
- Selection rules live in `pick-rules.mjs` and are tested in `loop.test.mjs`. Keep them pure.

## Tests
- `node --test tools/loop/loop.test.mjs` covers the picker and the model rules. `bash tools/backlog/scripts-smoke.sh` covers `ship.sh` and `park.sh` on a slot worktree.
