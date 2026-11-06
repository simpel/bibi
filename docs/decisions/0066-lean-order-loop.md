# 0066 – A lean order loop instead of the work-backlog workflow

- **Date:** 2026-10-24
- **Status:** Superseded by 0070
- **Supersedes:** 0065 points 2 (auto-merge) and 3 (the workload gate). Point 1 (main only moves through a PR) and point 4 (metrics) stay.
- **Related:** 0060 (versioning from Conventional Commits)

Decided to replace the model-orchestrated backlog workflow with a shell loop: scripts for every deterministic step, one lean headless session per order, a sort instead of a model to pick the next order, and parallel slots that open PRs but never merge. Replaced by committing straight to `main` (0070).
