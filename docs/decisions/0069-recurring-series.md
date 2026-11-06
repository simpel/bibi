# 0069 – Recurring series

- **Date:** 2026-10-24
- **Status:** Accepted
- **Related:** 0042 (superseded by this ADR), 0043 (replaced by statuses in 0067), 0044, 0027 (job scheduler), 0051, 0052, 0057, 0059, 0064
- **Spec:** `docs/specs/series.md` (to write when accepted)

## Context
- ADR 0042 removed recurrence. The target venue has weekly standing bookings, so staff copy orders by hand.
- The earlier series design was right that occurrences are real rows and clashes are shown, not refused. It was wrong in holding its own items and owners, a second copy of what orders and lines own, and in having no "all" scope, no skipped dates and no answer for occurrences with a sent quote.
- An invoice was limited to one non-VOID invoice per order, and a quote or invoice line belongs to exactly one document.

## Decision
1. A Series is an owned entity with a rule, an end and skipped dates. It stores no order data. The rule is columns (interval, day or week unit, weekdays, wall-clock start and end), not an RRULE string. Skips are rows, never a JSON list.
2. Occurrence times are wall-clock in the venue's zone, resolved to instants at generation (ADR 0064), so 09:00 stays 09:00 across DST.
3. Occurrences are real rows, generated up to a rolling 12-month horizon, never computed on read. A daily job extends open series as SYSTEM and reports clashes.
4. `ORDERS` mode: one order per occurrence, each with its own status, quote and invoice.
5. `LINES` mode: one order whose repeat lines carry the series and occurrence start. Per-occurrence state lives on the line (ADR 0044).
6. A series copies a template authored as an ordinary order, once at generation. There is no live link afterwards.
7. Every edit names a scope: `THIS`, `FOLLOWING` or `ALL`. `THIS` marks the occurrence detached, so later scoped edits skip it. `FOLLOWING` splits the series. Occurrences with a sent quote or non-VOID invoice are skipped and returned in a list, never rewritten (ADR 0052). Clashes are returned, not refused.
8. Cancel is a scope too. Past occurrences are never touched.
9. Orders mode money is unchanged.
10. Lines mode may invoice up front (one invoice) or per period. The one-invoice-per-order rule becomes "a line is on at most one non-VOID invoice". `invoice.create` optionally takes lines or a period and otherwise invoices all not-yet-invoiced lines.
11. A lines-mode quote snapshots all occurrence lines and is accepted once. Per-period invoices draw from it, and their sum must not exceed the quote. A later occurrence needs a new quote revision.
12. Operations exist in a `series` feature on every surface with `series:read|write` (member read, manager write). Edits are audited per affected order or line.

## Rejected
- Keeping ADR 0042: recurrence is the largest manual chore at target volume.
- Only orders mode or only lines mode: each loses something some venues need, and both are cheap once occurrences are rows.
- Computing occurrences on read: every consumer would need the engine, and per-occurrence edits need rows anyway.
- An RRULE string: needs a parser to validate and query.
- A series-level quote in orders mode: a second snapshot of lines the occurrence quotes already own.
- Many invoices over the same lines: breaks the derived balance (ADR 0057).

## Consequences
- ADR 0057's invoice rule changes through an addendum and a migration of the partial unique index.
- A weekly series holds about 52 occurrences at a time. A `FOLLOWING` split creates a second series row.
- Depends on the time-zone work of ADR 0064.
- Implementation orders: #452, #453, seed #457.
