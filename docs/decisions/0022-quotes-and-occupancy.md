# 0022 – Quotes and occupancy

- **Date:** 2026-10-14
- **Status:** Accepted
- **Related:** 0021 (configurable items), 0027 (job scheduler), 0034 (assignments), 0043 (ticket and phases), 0044 (line states)

## Context
- A ticket (ADR 0043) is quoted, its rooms and resources are reserved, and the customer accepts. Quotes must be reviewable, versioned and never edited after they are sent. Reserved resources must never be double-booked.

## Decision

### Quotes
- A quote (`Quote`) belongs to a ticket and is versioned. The state machine is fixed and lives in core (`features/quote/transitions.ts`): `DRAFT → SENT → ACCEPTED`, `DECLINED` or `EXPIRED`. Only a `DRAFT` can be edited; a changed quote is a new version.
- Transitions are their own commands: `quote.send`, `quote.accept`, `quote.decline`, `quote.expire`. Status can never be set through `update`. A disallowed transition gives `CONFLICT`.
- `quote.send` and `quote.accept` fire the quote events of ADR 0043, which move the ticket into the organization's phase for that event, if it has one.
- `quote.accept` stores `acceptedBy`, `acceptedAt` and `acceptanceMethod` (`MANUAL` now, later `BANKID` and `LINK`). It creates no other record.
- A quote uses the ticket's assignment (ADR 0034). Signing is postponed.
- A `SENT` quote past `validUntil` expires automatically (job, ADR 0027).

### Occupancy
- Occupancy (`Occupancy`) is a time block on a `BOOKABLE` item (ADR 0021) with the types `HOLD`, `SETUP`, `MAINTENANCE` and `INTERNAL`. A `HOLD` is derived from a line's state and is `SOFT` or `HARD` (ADR 0044); the other types are manual or follow their source.
- All active rows except soft holds must not overlap on one item. This is enforced with an exclusion constraint in Postgres (`btree_gist`) and mapped to `CONFLICT`.
- Setup time is added as `SETUP` right before the start, based on the setup's changeover time (`Setup`, ADR 0021).

## Consequences
- The quote state machine is tested as a table: every allowed and every disallowed transition.
- AI can propose quote commands but not perform them without approval (ADR 0007).

## Addenda
- 2026-10-19: a `DRAFT` quote is a live view of the ticket's lines and `quote.send` freezes a snapshot (ADR 0052). Line holds are a database projection (ADR 0053). History comes from history tables, not `AuditLog` (ADR 0054).
