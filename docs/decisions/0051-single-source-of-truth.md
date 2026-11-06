# 0051 – Single source of truth: owned, derived, projected and snapshot data

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0006, 0014, 0021, 0043, 0044, 0052–0057

## Context
- A review of the domain model found the same fact stored in several places and kept in sync by application code: line state and occupancy, quote lines and program lines, phase history next to phase columns, derived assignments, id lists and ids inside JSON.
- Every such pair can drift, and in a booking system drift means double bookings, wrong invoices and sheets that disagree with the quote.
- No production users existed, so it was the cheapest time to fix the model.

## Decision
Every column is one of four kinds, and the kind decides who may write it.
1. Owned: the fact itself, in exactly one place, written by the one operation that owns it.
2. Derived: computed on read, never stored.
3. Projection: derived but stored because a constraint or index needs it. Written only by the database or one named function in the same transaction, with a reconciliation check proving it matches.
4. Snapshot: a deliberate frozen copy at a moment that matters, written once and never updated.

Rules that follow: inherit with `null`, never copy. References are foreign keys, never id lists or ids in JSON (ADR 0056). The audit log is evidence, not data. External systems own their facts (Stripe owns payment status, balances are derived, ADR 0057). Workflow never stores facts: phases may require a fact as a guard but never copy it. Archive means removed, and the end of an order's life is a terminal phase.

## Rejected
- Keeping synchronised copies in application code: they drift.

## Consequences
- New features must say which kind each new column is.
- Some reads get a join or computation instead of a stored value. A projection is added only for a constraint or a measured query, never in advance.
- The principle is in `CLAUDE.md` and the domain model marks each attribute's kind.
