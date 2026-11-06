# 0022 – Quotes and occupancy

- **Date:** 2026-10-14
- **Status:** Accepted
- **Related:** 0021, 0027, 0034, 0043, 0044, 0052, 0053, 0054

## Context
- An order (ADR 0043) is quoted, its rooms and resources are reserved and the customer accepts.
- Sent quotes must be reviewable and never edited. Reserved resources must never be double-booked.

## Decision
1. A quote belongs to an order and is versioned. Its state machine is fixed and lives in core: `DRAFT`, `SENT`, then `ACCEPTED`, `DECLINED` or `EXPIRED`. Only a draft is editable; a changed quote is a new version.
2. Transitions are their own commands (`quote.send|accept|decline|expire`). Status is never set through `update`, and a disallowed transition gives `CONFLICT`.
3. Send and accept fire the quote events of ADR 0043. Accept records who, when and by which method, and creates nothing else. A sent quote past its validity expires by job (ADR 0027).
4. A draft quote is a live view of the order's lines and send freezes a snapshot (ADR 0052).
5. Occupancy is a time block on a bookable item: hold, setup, maintenance or internal. A hold is derived from a line's state, soft or hard (ADR 0044).
6. Active blocks except soft holds must not overlap on one item. Postgres enforces this with an exclusion constraint, mapped to `CONFLICT`.

## Rejected
- Editing a sent quote in place: the customer's accepted terms would change silently.
- Checking overlap in application code: it races under concurrent writes.
- E-signing in the first version: postponed.

## Consequences
- The state machine is tested as a table of allowed and disallowed transitions.
- The assistant may propose quote commands but not run them without approval (ADR 0007).
- Line holds are a database projection (ADR 0053); history comes from history tables, not `AuditLog` (ADR 0054).
