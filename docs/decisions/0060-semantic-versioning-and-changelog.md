# 0060 – Semantic versioning, git tags and changelog

- **Date:** 2026-10-20
- **Status:** Accepted
- **Related:** 0002 (monorepo), 0013 (hosting and deploy)

## Context
- Every package was at `0.0.0` with no tags and no changelog. Deploys are identified by git SHA, which says nothing to a human about what changed.
- Everything lives in one monorepo and is private. Each unit needs its own version and changelog.

## Decision
1. Each app and package has its own version, bumped independently. The root is not versioned.
2. Conventional Commits drive the bump per package, by the files a commit touches. `fix:` is a patch, `feat:` a minor, `!` or a `BREAKING CHANGE:` footer a major (a minor while `0.x`). Other types do not release.
3. Dependents follow. A package is patch-bumped when a workspace dependency it uses is released.
4. release-please runs on every push to `main` and keeps one release PR that bumps versions and changelogs. Merging it creates `@bibi/<name>-vX.Y.Z` tags and GitHub releases. Nobody edits versions or changelogs by hand.
5. Commit titles must be conventional. PR titles are checked in CI.

## Consequences
- A deploy still ships a SHA. Tags label SHAs already on `main`.
- A change to `@bibi/core` re-releases every dependent, so expect many patch bumps per release PR.
- The release PR is created with `GITHUB_TOKEN`, so CI does not run on it unless it is reopened or a GitHub App token is used.
- An unprefixed commit on `main` is ignored by the changelog, not an error.
