# 0025 – Demo data through core operations

- **Date:** 2026-10-14
- **Status:** Accepted
- **Spec:** `docs/demo-seed.md` (the source for the content and the checks)

## Context
- We need realistic data for development, demo and e2e tests.
- Data written directly with Prisma can end up in states the app can never reach, and it skips validation and audit.
- The configurable domain (ADR 0021) is visible only if the demo shows at least two organizations that are set up differently.

## Decision
- **`pnpm --filter @bibi/core seed:demo` creates two fictional organizations**, set up differently: Lindholmen Experience Center (conference, exhibition and restaurant, inspired by the reference customer) and Vingaleden Archipelago Tours (boat tours without food). Each gets its own types, lists, phases, states and grid.
- **All writes go through `execute` with core operations** as `SYSTEM`, including configuration and phase changes, so each organization sets itself up the way a real customer would. Rejected: writing directly with Prisma.
- **`docs/demo-seed.md` is the source** and the data files follow it. Checks defined there run after the seed in CI, so the seed is an integration test of the whole flow.
- The script is idempotent per org slug (it deletes and recreates only the demo organizations), refuses to run in production, and computes all dates relative to today.
- The seed grows with each part that is built; every ticket that adds or changes data states its seed change.

## Consequences
- The seed can only create what the operations support, so a missing operation is visible immediately.
- Playwright (`apps/web`) uses the same organizations instead of separate fixtures.
- When the domain changes, `docs/demo-seed.md` is updated in the same change.
