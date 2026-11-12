# 0107 – Push to main behind a pre-push hook

- **Date:** 2026-11-12
- **Status:** Accepted
- **Supersedes:** 0098 (pull requests with auto-merge gate main)
- **Related:** 0060 (versioning from Conventional Commits), 0070 (solo flow)

## Context
- ADR 0098 routed every change through a pull request with auto-merge. A change landed 10–15 minutes after it was
  committed, and the `main` ruleset that was meant to enforce it had been disabled, so the flow was ceremony.
- CI now runs as Turborepo tasks: in parallel, cached, and scoped to changed packages with `--affected`. Lint,
  structure, typecheck and the affected tests run in a few minutes locally.
- 0098 recorded why local checks alone failed before: 54 of 60 runs on `main` red, mostly because sessions share one
  working tree. That risk is accepted here, not solved.

## Decision
1. Commits are pushed straight to `main`. There is no ship branch, no pull request and no PR-title check.
2. A pre-push hook (`.githooks/pre-push`, installed by `pnpm install`) runs lint and structure, then typecheck and
   test for the affected packages. It is never skipped.
3. A commit-msg hook rejects titles that are not Conventional Commits, because release-please reads them.
4. CI still runs every job on `main` after the push. Build, e2e and Storybook run only there.
5. A red `main` is fixed before any other work. Deploys start from release-please releases, whose PR runs CI first.

## Rejected
- Keep the pull-request flow (0098): green `main` by construction, but slow, and it was not enforced.
- Push with no hook: fastest, but repeats the red `main` that 0098 measured.

## Consequences
- A change lands at once; `main` can go red between a push and the next fix.
- The hook checks the shared working tree, not the pushed commits: another session's uncommitted file can fail or
  pass it. Sessions tell the user instead of skipping the hook.
- e2e and the build never gate a push; their failures show up on `main`.
- Pushing needs Postgres up for the tests.
