# 0065 – Pull requests only, and a workload gate for work-backlog

- **Date:** 2026-10-22
- **Status:** Superseded by 0070 (points 2 and 3 earlier by 0066)
- **Related:** 0060 (versioning from Conventional Commits), 0013 (hosting and deploy)

Decided that `main` moves only through a pull request, that the backlog run opens a PR and arms auto-merge without waiting for CI, and that a workload gate decides whether the parallel workflow is worth its fixed cost. Replaced by the lean loop (0066) and then by committing straight to `main` (0070).
