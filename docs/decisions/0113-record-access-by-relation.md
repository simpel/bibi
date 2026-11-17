# 0113 – Record access by relation

- **Date:** 2026-11-17
- **Status:** Accepted (the user's decision, 2026-11-17: involved = creator, assignee, follower; totals count visible orders; `related` refused for admins and API keys)
- **Amends:** 0050 (a record scope beside capability), 0055 (derived relations become a database projection), 0111 §3 (API keys see only shared views)
- **Related:** 0004, 0034, 0051, 0071, 0097
- **Spec:** `docs/specs/record-access.md`

## Context
- Permissions decide what a member may do (`<feature>:<action>`, ADR 0050), never which records. Anyone with `order:read` sees every order on every surface.
- Some members should see only the orders they work on: freelancers, temporary staff, external sales.
- Bibi already grants access by relation in six places, each hand-written with its own rules for "no user": board views (owner, shared with), conversations and personal skills (owner), notifications (recipient), OAuth grants, user-scoped rows. "Involved with an order" has five definitions, some built from id lists with one query per responsibility.
- ADR 0004 rejected scoping by convention for tenancy: one missed filter is a leak.

## Decision
1. **Capability and rows are separate.** RBAC (presets plus overrides) decides the action. A relation scope decides the rows. Field gating by feature (`canView`, `visibleTo`) is unchanged.
2. **One scope per member and root.** `all` (default for every preset) or `related`, stored as a difference only (`RecordScopeOverride`), edited with permission overrides (`member:write`). The only configurable root is `order`; everything owned by an order inherits its visibility through its parent path. `related` is refused for the admin preset and for API keys.
3. **Related to an order** = creator, main assignee, a responsibility's assignee (explicit or default) or a follower (defaults plus follows minus unfollows).
4. **Derived relations are a projection** (`RecordRelation`), written only by database triggers from one SQL derivation and checked by a reconciliation, like line holds. It replaces every application-side derivation of "who is on this order". `related` compiles to one indexed `EXISTS`.
5. **Scope is declared and enforced.** Every query on a record-scoped model, and every hop into one, carries either the caller's scope (`visibleWhere`) or a named engine purpose (`allRecordsWhere`: capacity, integrity, configuration, derivation, system). The scoped client refuses a query with neither. Operations declare the scoped ids they take and return, and execute checks them before the handler.
6. **Hidden records are `NOT_FOUND`.** `FORBIDDEN` means only a missing capability; `VALIDATION` is never authorization.
7. **Capacity counts everything.** A booking the caller cannot see blocks as before and shows as "Busy" with its times and hold kind only. Totals (dashboard, finance, customer values) count only visible orders.
8. **One rule set per actor.** SYSTEM sees all. A user sees their scope, their own personal records, and others' only with an explicit oversight permission. The AI acts as its user without oversight. An API key sees all orders, no personal records and only default and organization-shared views.

## Rejected
- An external relation engine (OpenFGA, SpiceDB): copies relations that already live in Postgres, filters lists poorly, adds a service.
- Silent filtering in the scoped client: engine reads (capacity, numbering, usage guards) would quietly see fewer rows, and included to-one relations cannot be filtered.
- Filtering in each handler by convention: rejected for tenancy for the same reason.
- An `order:all` permission action: mixes capability with record selection.
- Deriving relations on read: needs id lists or one query per responsibility; no correct, fast predicate exists without the projection.

## Amendment (2026-11-17, the user's decision: "do the longterm best solution")
- Decision 5 is enforced per client, not per `where`: Prisma copies query arguments before an extension sees them, so a marked `where` cannot be recognised. The plain scoped client refuses record-scoped models; `context.records` applies the caller's scope (top level and list relations, and refuses a single-record hop it cannot filter); `context.engine({ purpose })` sees every row, and each use is in a reviewed snapshot.
- Postgres row-level security follows as a second layer once every query declares its intent, after a measured spike on the heaviest pages (ADR 0097): it also covers raw SQL and code outside core.

## Consequences
- New tables `RecordScopeOverride` and `RecordRelation` with triggers; `AuditLog` gains `orderId` and `boardId` so audit rows follow the record they describe.
- About 450 queries are converted; enforcement turns on per model, so main stays green. Guard tests cover markers, declarations, a same-organization behaviour suite per operation and an allowlist of every engine read.
- Board, conversation, skill, notification and OAuth grant rules move into one access module. API keys stop seeing private views; the AI stops inheriting conversation oversight.
- Touches auth, tenancy and the parity core: built at Opus level.
