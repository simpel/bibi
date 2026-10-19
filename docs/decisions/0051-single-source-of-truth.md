# 0051 – Single source of truth: owned, derived, projected and snapshot data

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0006 (database conventions), 0014 (logging), 0021 (configurable items), 0043, 0044, 0052–0057

## Context
- A red-team review of the domain model found the same fact stored in more than one place, kept in sync by application code:
  - a line's state and its `Occupancy` row (ADR 0044),
  - quote lines (`OrderLine`) and program lines (`ProgramItem`), which describe the same booking twice with no link,
  - phase history in `AuditLog` next to `Ticket.phaseChangedAt` / `phaseReason`,
  - per-responsibility assignments that are created and archived when lines change (ADR 0034, #250),
  - id lists (`String[]`) and ids inside JSON (`LINK` fields) with no foreign key,
  - `Ticket.quantity` next to `estimatedHeadcount`, and a line `quantity` copied from it.
- Every pair can drift. Drift in a booking system means double bookings, wrong invoices and sheets that disagree with the quote.
- There are no production users (no backwards compatibility needed), so this is the cheapest moment to fix the model.

## Decision
Every piece of data is one of four kinds. Each column is classified, and the class decides who may write it.

| Kind | Meaning | Who writes it |
|---|---|---|
| **Owned** | The fact itself. Exactly one place. | The one core operation that owns it. |
| **Derived** | Computed from owned data on read (query, view, generated column). Never stored as a separate value. | Nobody. |
| **Projection** | Derived, but stored because a database constraint or index needs it (e.g. the exclusion constraint on occupancy). | Only the database (trigger) or a single named function, in the same transaction as the owned change. Can always be rebuilt, and a reconciliation check proves it matches. |
| **Snapshot** | A deliberate, frozen copy of owned data at a moment that matters (a sent quote, a sent sheet). | Written once, never updated. Names its source and when it was taken. |

Rules that follow:
1. **Inherit, never copy.** A child that defaults from a parent stores `null` for "inherit" and an explicit value only for an override. This already holds for `Item.vatRatePercent` and `Customer.paymentTermsDays`. It now also holds for line quantity (ADR 0052) and for responsibility assignees (ADR 0055).
2. **References are relations.** No id lists in `String[]` and no ids inside JSON without a foreign key (ADR 0056).
3. **The audit log is evidence, not data.** No feature reads its own state or history from `AuditLog`. Domain history is owned data (ADR 0054).
4. **External systems own their facts.** Stripe owns payment status. Our row is a mirror, written only from the provider signal path (ADR 0028), and money balances are derived (ADR 0057).
5. **Workflow never stores facts.** A ticket's phase is workflow. Quote acceptance, payments and holds are facts on their own records. Phases may *require* a fact as a guard. They never copy it (ADR 0054).
6. **Archive is not a lifecycle.** `status = ARCHIVED` means removed (mistake, cleanup). The end of a ticket's life is a `terminal` phase. Neither is used to mean the other.
7. **Every projection has a reconciliation check** in the demo seed checks (`packages/core/src/seed/demo/checks.ts`) and in a test, which rebuilds it from owned data and compares.

## Consequences
- `docs/domain-model.md` marks every attribute as owned, derived, projection or snapshot once the follow-up ADRs are accepted.
- `CLAUDE.md` gets the principle under "Architecture principles" when this ADR is accepted.
- New features must say which kind each new column is. The `new-entity` and `new-core-operation` skills ask for it.
- Some reads get a join or a computation instead of a stored value. That is accepted. A projection is added only when a constraint or a measured query needs it, never in advance.
