# 0070 – Solo flow: two skills, commits straight to main

- **Date:** 2026-10-24
- **Status:** Accepted, superseded in part by 0075
- **Supersedes:** 0065 (pull requests only, workload gate) and 0066 (the order loop)
- **Related:** 0060 (versioning from Conventional Commits), 0075

## Context
- Bibi has one developer. The machinery built for autonomous agents (backlog workflow, order loop, parked branches, a PR per order) cost more attention than it saved.
- Every order became a PR to review and merge by hand, parked branches needed recovery, and parallel slots broke each other's tests.
- Guidance was spread over 18 skills that mostly repeated the package `CLAUDE.md` files.

## Decision
1. Two skills: one creates an order, one builds it in its own worktree with its own database and ports, runs the CI checks locally, makes one conventional commit and pushes it to `main`. The rules the other skills held live in short form in that skill and the package `CLAUDE.md` files.
2. No pull requests for order work. `main` has no branch protection. Local checks are the gate and CI still runs on every push. A red `main` is fixed before the next order. release-please keeps its release PR (ADR 0060).
3. The loop, the shipping, parking and metrics scripts and the other skills are removed.

## Rejected
- Keeping the loop and simplifying it: each version still left a PR per order, which cost the most attention.

## Consequences
- A bad commit can reach `main` before CI sees it. The local checks equal CI's, so this happens only with flaky or environment-dependent tests.
- Runs meet only at the push, by rebasing onto `origin/main` and rerunning the checks.
- One commit per order gives release-please one changelog entry per order.
- ADR 0075 later removed the ticket step.
