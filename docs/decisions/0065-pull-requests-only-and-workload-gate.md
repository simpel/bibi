# 0065 – Pull requests only, and a workload gate for work-backlog

- **Date:** 2026-10-22
- **Status:** Accepted; points 2 (auto-merge) and 3 (the workload gate) superseded by 0066
- **Related:** 0060 (versioning from Conventional Commits), 0013 (hosting and deploy)

## Context
- The first `work-backlog` run (2026-10-22, 103 minutes) landed two tickets (+177/−90 lines). Coding took about 11 minutes. The rest was waiting: about 39 minutes for CI on `main` after each merge (the run waited for `publish-images` and `deploy` too), about 34 for pull request CI and about 15 for two fix rounds on a flaky e2e test.
- The run squash-merged each PR itself, one at a time. `main` had no protection, so direct pushes also happened.
- Most of the backlog was blocked, so each batch held one ticket and nothing ran in parallel.

## Decision
1. **Main only moves through a pull request.** A ruleset on `main` requires a PR and the checks `check`, `storybook`, `e2e`, `tools` and `conventional-title`. Admins can bypass only through a PR (release-please PRs, emergencies). Direct pushes are blocked.
2. **The run never merges and never waits for CI.** It opens the PR and arms GitHub auto-merge at once (`tools/backlog/arm.sh`); GitHub does the waiting. A PR that goes red is left to Auto-fix or a person. It no longer rebases onto a moved `main` unless the PR conflicts, no longer serialises merges and no longer waits for CI on `main` afterwards; it only refuses to start while `main` is red.
3. **A gate decides if the workflow is worth running** (`tools/backlog/gate.mjs`): at least 3 tickets that can run in parallel (one per ADR, an XL or codemod ticket runs alone), or at least 2 with sizes adding up to 8 (XS 1, S 2, M 3, L 5, XL 8). Otherwise the workflow stops at the gate and the `work-tickets` skill does the tickets in the current session, all in one branch and one PR. `force: true` skips the gate.

4. **Every run is recorded** (`tools/backlog/metrics.mjs`, a local JSONL log next to the worktrees) so the setup can be judged on numbers after about 4 weeks. The baseline is the 2026-10-22 run.

## Consequences
- A red PR is no longer parked by the run: nothing watches it unless Auto-fix or a person does.
- A dependent ticket becomes selectable only after its blocker has merged, so a chain needs one run per link.
- One inline PR squashes to one commit on main, so release-please gets one entry for several tickets.
- `main` can still break through two PRs that are green alone; the post-merge `main` CI run and rollback.yml remain the safety net. A merge queue is the next step if that happens (not decided).

## Rejected
- **Keep the workflow merging, only skip the `main` wait:** still allows direct pushes and keeps serial merges.
- **The workflow only opens PRs and a person merges them all:** moves the waiting to the person; auto-merge keeps the checks as the only gate.
- **Always use the workflow:** its fixed cost per ticket makes one or two small tickets about 10 times slower than doing them in a session.
