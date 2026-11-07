# 0098 – Pull requests with auto-merge gate main

- **Date:** 2026-11-07
- **Status:** Accepted
- **Supersedes:** 0070 in part (no pull requests, no branch protection, local checks as the gate) and 0075 in part ("commits straight to `main`")
- **Related:** 0060 (versioning from Conventional Commits)

## Context
- ADR 0070 made local checks the only gate before `main`. In practice 54 of the last 60 CI runs on `main` failed.
- Several sessions work in one checkout at once. A commit can build locally only because of another session's uncommitted file. One such type error stayed red for 21 pushes.
- Sessions skipped the full checks (file length, isolation and generative-UI contracts), and e2e never runs locally, so UI changes broke specs unseen.
- A `main` that is always red hides every new failure.

## Decision
1. Work is still committed in the main checkout. It reaches `main` only through a pull request: `pnpm ship` pushes `HEAD` to its own branch, opens a PR with the commit's conventional title, and turns on auto-merge (merge commit).
2. `main` is protected. The CI jobs `check`, `e2e`, `storybook` and `tools` must pass, and nobody pushes to it directly, admins included. Branches need not be up to date, because PR CI already tests the merge with the current `main`.
3. Nobody waits for CI. The session that shipped is told when CI goes red, and it fixes the branch until the PR merges.

## Rejected
- A pre-push hook running all checks (5–15 min per push): too slow, and it would check the shared working tree rather than the pushed commits.
- A fast pre-commit guard only: cheaper, but it never runs e2e and `main` can still go red.
- A bot that repairs a red `main` afterwards: `main` would still be red between the break and the fix, and every failure would cost API usage.

## Consequences
- `main` is green by construction. A broken commit waits in its PR instead of reaching everyone.
- A change lands about 10–15 minutes after `pnpm ship` instead of at once. Nobody waits on it.
- A PR may carry other sessions' unshipped commits from the shared checkout. A failure in them blocks that PR until someone fixes it.
- release-please reads the conventional commits inside each merge. Its own release PR is unchanged.
