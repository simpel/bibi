---
name: new-feature
description: Entry point for any ticket that adds or changes behaviour (entity, operation, UI flow, lifecycle rule). Fixes the order of work and the gates that must pass before a ticket is done. Use first, then follow the skills it names.
---

# New feature

One order, one definition of done. Core first, adapters in the same change (ADR 0003).

## Order
1. **Read the spec:** the issue's "To do", "Seed data" and "Done when", and the linked ADR. If it needs a human decision, stop and report blocked. Never guess a rule.
2. **Reuse first:** `rg` for an existing helper, schema or pattern before writing one. Extract at the second duplicate (`checkCustomer` was duplicated in contact and booking).
3. **Build in this order**, using the skill for each step: `db-migration` → `new-entity` (new entity, runs `pnpm gen entity`) or `new-core-operation` (new command/query) → adapters → web (`new-ui-component`, `i18n-strings`) → seed (the ticket's "Seed data" section: demo data, checks, `docs/demo-seed.md`) → docs (`domain-model.md` + artifact, `add-adr` for a decision).
4. **Run the gates below**, then the full checks.

## Gates (each one was a follow-up bug before)
- **Isolation (enforced):** every new operation has a step in `apps/mcp/test/isolation-<area>.test.ts` where organization B calls the tool with organization A's ids and gets `NOT_FOUND`. `isolation-coverage.test.ts` fails otherwise. It scans for literal tool names (`"skill_get"`), so never build them with template strings. `ISOLATION_GAPS` is empty: never add to it.
- **Referenced ids:** every id in the input that points at another record (customer, package, base, owner, LINK target) is checked for organization and for `<resource>:read` on the target. Test with another organization's id and with a caller who lacks the permission.
- **Read permission everywhere:** the `embeddable` sets `readPermission`. Search hits, lists, nav items and UI sections are gated by the same permission. Search text has no raw ids, no names the viewer may not read, and no Swedish literals.
- **Lifecycle:** state what links to this record and what happens when it is archived, renamed, removed or changes phase (cascade, block, or reindex). Cover each with a test. Removing a member cleans up their assignments, follows and keys.
- **Concurrency:** a unique key or count-then-write can race. Return `CONFLICT` (never `INTERNAL`) and make check-and-write atomic.
- **AI surface:** every command has a localized approval label in `approval-labels.ts`, a `tool-ui-registry.ts` entry and untrusted-content handling for free text from outside.
- **Column kinds (ADR 0051):** every new column is owned, derived, projection or snapshot, stated in the ticket and in the model comment. Inherit instead of copy; no id lists or ids in JSON without a foreign key.
- **Reconciliation check:** every projection registers a check in `packages/core/src/seed/demo/reconcile-checks.ts` with `defineReconciliation({ name, rebuild, compare })`: `rebuild` derives the expected rows from owned data, `compare` reads the stored rows and returns one message per difference. Add it to `RECONCILIATIONS`. `checks.ts` runs them all and Vitest can call `reconcileProjections`. Template: `lineHoldsReconciliation`.
- **Lists and pickers:** paginate or search server-side (no "first 100"), batch reads (no N+1).
- **Configurable domain:** no domain words in code. Behaviour comes from org data and generic flags (ADR 0021, 0043, 0044).

## Scope
Out-of-scope problems go in `followUps` with file:line. Do not fix them here and do not leave a gate undone by calling it a follow-up: the gates above belong to this ticket.

## Done
`pnpm lint && pnpm check:structure && pnpm typecheck && pnpm test` green and `seed:demo` from an empty database with green checks, then `tenancy-review` on the diff for core, db, auth, MCP or approval changes.
