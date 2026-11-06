# 0025 – Demo data through core operations

- **Date:** 2026-10-14
- **Status:** Accepted
- **Spec:** `docs/demo-seed.md`

## Context
- Development, demos and e2e tests need realistic data.
- Data written directly with Prisma can reach states the app never can, and skips validation and audit.
- The configurable domain (ADR 0021) is only visible if the demo has organizations set up differently.

## Decision
1. `seed:demo` creates two fictional organizations with different setups: a conference and restaurant venue, and a boat tour operator without food.
2. All writes go through `execute` with core operations as `SYSTEM`, including configuration, so each organization sets itself up as a real customer would.
3. `docs/demo-seed.md` is the source. Checks defined there run after the seed in CI, so the seed is an integration test of the whole flow.
4. The script is idempotent per organization slug, refuses to run in production and computes dates relative to today.
5. A change that adds or changes data or behaviour updates the seed.

## Rejected
- Writing directly with Prisma: it bypasses validation, audit and reachable states.

## Consequences
- The seed can only create what operations support, so a missing operation shows at once.
- Playwright uses the same organizations instead of separate fixtures.
