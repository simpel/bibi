# 0075 – No ticket step: ADRs drive the work

- **Date:** 2026-11-01
- **Status:** Accepted
- **Supersedes:** 0070 in part (the `new-ticket` skill, the board and `Closes #N`)
- **Related:** 0060 (versioning from Conventional Commits)

## Context
- ADR 0070 made every piece of work an issue on GitHub project 8, created with `new-ticket` and built with `implement-ticket`.
- Most work is small and the user says what to do directly. Creating an issue and a board card first, then keeping its status true, cost a step that added no information.

## Decision
1. **No ticket is required.** The user describes the work and the `implement` skill builds it in its own worktree and commits to `main` as before.
2. **ADRs stay.** A major architectural move (a decision with a rejected alternative or a costly reversal) gets an ADR first, accepted by the user. Accepted ADRs are the basis for new implementations.
3. **Removed:** the `new-ticket` and `implement-ticket` skills (the latter became `implement`), `tools/backlog/`, board states and the **Seed data** ticket section. The seed rule stays: changed data or behaviour updates the demo seed.
4. GitHub issues may still be opened by hand; nothing depends on them.

## Consequences
- Less ceremony. Context that lived in an issue now lives in the request, the commit body, an ADR or `docs/specs/`.
- Commit bodies no longer carry `Closes #N`. release-please is unaffected (ADR 0060).

## Rejected
- **Keep tickets optional in the skill.** Two paths in one skill is more to follow than one.
