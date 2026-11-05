# 0070 – Solo flow: two skills, commits straight to main

- **Date:** 2026-10-24
- **Status:** Accepted
- **Supersedes:** 0065 (pull requests only, workload gate) and 0066 (the order loop)
- **Related:** 0060 (versioning from Conventional Commits)

## Context
- Bibi has one developer. The machinery built for autonomous agents cost more attention than it saved:
  - the `work-backlog` workflow, then the order loop with parallel slots,
  - parking branches, a pull request per order, and a ruleset that required one.
- The loop worked, but every order became a PR to review and merge by hand. Parked branches needed recovery. Two slots made each other's tests time out. Board cards needed fixing by hand.
- Work-specific guidance was spread over 18 skills. Most of it repeated the package `CLAUDE.md` files.

## Decision
1. **Two skills.**
   - `new-order` creates an order.
   - `implement-order` builds one order in its own worktree (`pnpm wt:new order-<N>`, own `.env`, database and ports), runs the CI checks locally (`node tools/ci/verify.mjs`), makes one commit `<type>: <summary>` with `Closes #N` and pushes it to `main`.
   - The rules the other skills held (operations, migrations, tenancy, seed) are kept in short form in `implement-order` and in the package `CLAUDE.md` files.
2. **No pull requests for order work.**
   - `main` has no branch protection. The local checks are the gate, and CI still runs on every push to `main`.
   - A red `main` is fixed before the next order.
   - release-please keeps its release PR (ADR 0060).
3. **Removed:**
   - `tools/loop/`,
   - the backlog scripts for shipping, parking, locks, CI polling and metrics,
   - the skills `work-orders`, `triage-parked`, `new-feature`, `new-entity`, `new-core-operation`, `db-migration`, `fix-bug`, `refactor`, `add-tests`, `write-docs`, `codemod`, `add-adr`, `i18n-strings`, `new-ui-component`, `parity-check`, `structure-fix` and `tenancy-review`.
   - `tools/backlog/order.mjs` and `select.mjs` stay.

## Consequences
- A bad commit reaches `main` before CI has seen it. The local checks are the same as CI's, so this happens only when a test is flaky or depends on the environment.
- Each run has its own worktree and environment, so runs never share a database or ports and the main checkout stays free for the user. Runs meet only at the push: the rebase onto `origin/main` and a rerun of the checks.
- Commits on `main` are one per order, so release-please keeps one changelog entry per order.

## Rejected
- **Keep the loop and simplify it.** Each simplification still left a pull request per order, which is the part that cost the most attention.
