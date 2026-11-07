# 0075 – No ticket step: work starts from the request

- **Date:** 2026-11-01
- **Status:** Accepted, superseded in part by 0098 (work reaches `main` through a pull request)
- **Supersedes:** 0070 in part (the `new-ticket` skill, the board and `Closes #N`)
- **Related:** 0060 (versioning from Conventional Commits)

## Context
- ADR 0070 made every piece of work an issue on GitHub project 8, created with `new-ticket` and built with `implement-ticket`.
- Most work is small and the user says what to do directly. Creating an issue and a board card first, then keeping its status true, added no information.

## Decision
1. No ticket is required. The user describes the work and the `implement` skill builds it and commits straight to `main`.
2. Features are built from specs in `docs/specs/` and need no ADR. Only a decision that is costly to reverse (schema, auth, money, tenancy, parity, infrastructure) and has a real rejected alternative gets a one-page ADR, accepted by the user before building.
3. Removed: the `new-ticket` and `implement-ticket` skills, `tools/backlog/` and board states. The seed rule stays: changed data or behaviour updates the demo seed.
4. GitHub issues may still be opened by hand; nothing depends on them.

## Rejected
- Keep tickets optional in the skill. Two paths in one skill is more to follow than one.
- Keep ADRs as the basis for every feature. They grew into feature specs; specs now hold behaviour.

## Consequences
- Less ceremony. Context that lived in an issue now lives in the request, the commit body, a spec or an ADR.
- Commit bodies no longer carry `Closes #N`. release-please is unaffected (ADR 0060).
