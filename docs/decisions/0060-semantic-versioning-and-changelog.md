# 0060 – Semantic versioning, git tags and changelog

- **Date:** 2026-10-20
- **Status:** Accepted
- **Related:** 0002 (monorepo), 0013 (hosting and deploy)

## Context
- Every package was at `0.0.0`, there were no git tags and no changelog. Deploys are identified by git SHA only (ADR 0013), which says nothing to a human about what changed.
- All apps and packages live in one monorepo and are `private`: nothing is published to npm. Each unit needs its own version and changelog.

## Decision
- **Each app and package has its own version**, bumped independently, starting at `0.1.0`. The root `package.json` is not versioned.
- **Conventional Commits drive the bump**, per package, from the files a commit touches: `fix:` is a patch, `feat:` a minor, `<type>!:` or a `BREAKING CHANGE:` footer a major (a minor while the package is `0.x`). `docs:`, `chore:`, `test:`, `refactor:` and `ci:` do not release on their own. A commit that touches several packages counts for each of them.
- **Dependents follow.** The `node-workspace` plugin bumps a package (patch) when a workspace dependency it uses (`workspace:*`) is released, so `@bibi/web` is released when `@bibi/core` is.
- **release-please** (`.github/workflows/release.yml`, config in `release-please-config.json`, state in `.release-please-manifest.json`) runs on every push to `main`. It keeps one open release PR that bumps each changed package's `package.json` and prepends to its own `CHANGELOG.md`. Merging it creates a git tag and GitHub release per released package, `@bibi/<name>-vX.Y.Z`. Nobody edits versions or changelogs by hand.
- **Commit titles must be conventional.** PR titles are checked by `.github/workflows/pr-title.yml` (squash-merge keeps the title). The ticket loop's `ship.sh` (formerly the `work-backlog` landing step) prefixes the issue title with a type from the ticket's Kind: Feature `feat`, Bugfix `fix`, Codemod and Tech debt `refactor`, Docs `docs`, Test `test`.
- History before this ADR is excluded from the changelogs (`bootstrap-sha`).

## Consequences
- The release PR is created with `GITHUB_TOKEN`, so CI does not run on it automatically. Close and reopen it, or switch the workflow to a GitHub App token, if CI must run on the release PR.
- A deploy still ships a SHA. Tags label SHAs already on `main`; deploying and rolling back by tag can be added later.
- A change to `@bibi/core` re-releases every app and package that depends on it. Expect many patch bumps per release PR.
- Commits are attributed by path, so a `feat:` that only touches `apps/web` does not release `@bibi/core`.
- An unprefixed commit pushed directly to `main` is ignored by the changelog. It is not an error.
