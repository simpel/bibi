# 0025 – Demo data through core operations

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- We need realistic data for development, demo and e2e tests.
- Data written directly with Prisma can end up in states the app can never reach, and it skips validation and audit.
- The configurable domain (ADR 0021) is visible only if the demo shows at least two organizations that are set up differently.

## Decision
- `pnpm --filter @okazi/core seed:demo` creates two fictional organizations:
  - **Lindholmen Experience Center** (experience center): conference, exhibition and restaurant, inspired by the reference customer.
  - **Vingaleden Archipelago Tours** (archipelago tours): boat tours without food.
- The content is specified in `docs/demo-seed.md`. That file is the source, and the data files in the code follow it.
- All writes go through `execute` with core operations, including configuration and phase changes. The actor is `SYSTEM`. Each organization thus sets itself up the same way a real customer would.
- The script is idempotent per org slug. A new run deletes and recreates only the demo organizations. It refuses to run in production.
- All dates are computed relative to today's date, so the data does not go stale.
- The seed grows with each part that is built:
  1. Custom roles (ADR 0020)
  2. Configurable domain: types, fields, vocabularies, setups and behaviors (ADR 0021)
  3. Items and composition: catalog and packages
  4. Customers, price lists, ticket phases and item states (ADR 0022, 0023, 0043, 0044)
  5. Tickets, lines and requirements
  6. Sheets with matching and blocking
  7. Export (ADR 0024)
- The checks in `docs/demo-seed.md` run after the seed in CI. The seed thus works as an integration test of the whole flow.

## Consequences
- The seed can only create what the operations support. If an operation is missing it becomes visible immediately.
- The same organizations are used by Playwright (`apps/web`) instead of separate fixtures.
- When the domain changes, `docs/demo-seed.md` must be updated in the same change.
