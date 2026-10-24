# 0069 – Recurring series

- **Date:** 2026-10-24
- **Status:** Accepted
- **Related:** 0042 (superseded by this ADR), 0043 (phases, replaced by ticket statuses in ADR 0067, #462), 0044 (line states), 0027 (job scheduler), 0051 (single source of truth), 0052 (the line is the booking), 0057 (money is derived), 0059 (capabilities, buffers), 0064 (time and time zones)
- **Spec:** `docs/specs/series.md` (to write when accepted)

## Context
- ADR 0042 removed recurrence while the core flow was ticket templates. The target venue (Lindholmen, 50 users, 100 tickets on the calendar) has weekly standing bookings, so staff copy tickets by hand today.
- Checked (2026-10-24):
  - The old `BookingSeries` (commit 896f67bf, removed in 92154bc9; issues #59 to #62) took an RRULE, a first start and a length, created one booking per occurrence in one transaction (capped at 12 months or 52 occurrences) and flagged clashing occurrences instead of refusing them. Edits were `THIS` or `FOLLOWING` (#60).
  - Right: occurrences are real rows, so calendar, holds, sheets and quotes need no special case; clashes are shown rather than blocking the series; edit scope was explicit.
  - Wrong: a series held its own items, headcount and owners, a second copy of what a ticket and its lines own (ADR 0051). It had no "all" scope, no skipped dates, and no answer for occurrences that already had a sent quote.
  - `Invoice` has a partial unique index `Invoice_ticketId_open_key` (`organizationId, ticketId WHERE status <> 'VOID'`), and `invoice.create` refuses a ticket with another non-VOID invoice (migration `20261114000000_payments_settle_receivables`, `packages/core/src/features/invoice/create-operation.ts`).
  - `OrderLine` is a snapshot of one priced line and belongs to exactly one quote or invoice (ADR 0052, 0057). Nothing records which lines an invoice covers beyond that row set.
  - No time-zone column exists yet (ADR 0064 is accepted, not built).

## Decision

### Shape
1. A **Series** is a new owned entity with a rule, an end and skipped dates. It stores no ticket data: items, headcount, assignee and prices stay on tickets and lines (ADR 0051).
   - Rule: `interval` (n), `unit` (`DAY` or `WEEK`), `weekdays` (for `WEEK`), a wall-clock `startTime` and `endTime`, a first date. No RRULE string: the three shapes we offer are columns we can validate and query.
   - End: at most one of `untilDate` or `count`. With neither, the series is open-ended. There is no cap on the total number of occurrences; the horizon in rule 3 bounds how many exist at a time.
   - Skipped dates: `SeriesSkip(seriesId, date)`, one row per skipped date, never a date list in JSON (ADR 0056).
2. Occurrence times are **wall-clock times in the venue's zone** (`effectiveTimeZone`, ADR 0064). Each occurrence is resolved to instants when it is generated, so a weekly 09:00 stays 09:00 across DST. Gap and ambiguity rules are ADR 0064 rules 5 and 6. Stored values are instants; the plain dates are code-level keys.
3. **Occurrences are real rows, generated up to a rolling horizon of 12 months ahead**, never computed on read. Creating a series generates every occurrence inside the horizon at once. A daily job (pg-boss, ADR 0027) extends every series that has not ended up to the horizon, running as SYSTEM, and reports clashes the same way an edit does (rule 7). A weekly booking for several years is one series, not a chain of them. The first date and rule are the only recurrence state; changing them regenerates only untouched occurrences (rule 7).

### Two modes, chosen per series
4. `mode = TICKETS`: one ticket per occurrence. `Ticket.seriesId` (nullable FK) and `Ticket.occurrenceStart` (owned instant, unique with `seriesId`). Each ticket has its own status, quote and invoice. ADR 0057 is untouched.
5. `mode = LINES`: one ticket. Its lines carry `Line.seriesId` and `Line.occurrenceStart`; all repeat lines of one occurrence share the start. The ticket has one status and one assignee. Per-occurrence state lives on the line (ADR 0044), so a single day can be released or moved without a new ticket.
6. A series has a **template**: the first occurrence is authored as an ordinary ticket (or its lines), and the series copies it. The copy is made once at generation; later template edits reach occurrences only through an edit scope (rule 7). The series does not hold a live link to a template (no inheritance of ticket data).

### Editing
7. Every edit names a scope: `THIS`, `FOLLOWING` (this date and later) or `ALL`.
   - `THIS` changes one occurrence and marks it `detached`: later `FOLLOWING` and `ALL` edits skip detached occurrences unless the caller passes `includeDetached`.
   - `FOLLOWING` splits the series at the date: the old series ends the day before, a new series (same mode, new rule) starts there and takes the later untouched occurrences. Billing history never moves.
   - `ALL` applies to every non-detached occurrence.
   - Occurrences with a **sent quote or non-VOID invoice are skipped** and returned in a `skipped` list with the reason; the operation succeeds for the rest. It never rewrites a snapshot (ADR 0052).
   - Clashes are returned, not refused: the occurrence is created and its hold is a soft or blocked state per ADR 0053, flagged in the result.
8. **Cancel** is a scope too: `THIS` skips one date (adds a `SeriesSkip` and releases its lines or ticket), `FOLLOWING` ends the series, `ALL` ends it now. Past occurrences are never touched.

### Money
9. **Tickets mode:** unchanged. One quote and one invoice per occurrence ticket.
10. **Lines mode, up front:** one quote over all occurrence lines, one invoice. Unchanged from today's one-invoice rule.
11. **Lines mode, per period:** several invoices per ticket. The partial unique index is replaced by a rule on lines: **a line is on at most one non-VOID invoice**. `OrderLine` already links a snapshot line to exactly one invoice; the new constraint is a partial unique index on `OrderLine(lineId) WHERE invoiceId IS NOT NULL AND invoice is not VOID` (enforced by a trigger or a denormalised status-free check listed in `packages/db/CLAUDE.md`). `invoice.create` gains optional `lineIds` or a `period`; with neither it invoices all not-yet-invoiced lines, so an ordinary ticket behaves exactly as today (one invoice, then nothing left to invoice).
12. **Quote vs occurrence:** a quote in lines mode snapshots all lines of the ticket, including every occurrence, and is accepted once. Per-period invoices then draw from the accepted quote's lines. Sending the quote freezes its occurrences (rule 7). An occurrence added later needs a new quote revision (ADR 0052). In tickets mode there is no series-level quote; a "quote for the whole series" is an invoice-time convenience only, not a stored document.
13. Balance stays derived (ADR 0057): accepted quote minus settled payments. Per-period invoices do not change the formula; the sum of non-VOID invoice lines must not exceed the quote, checked in `invoice.create`.

### Surfaces, permission, seed
14. New core operations in a `series` feature: `series.create|get|list|update|cancel`, `series.occurrences`. Exposed in web, GraphQL, REST and MCP in the same change, with parity entries. Permission `series:read` and `series:write` (ADR 0050), member read, manager write. Edits and cancel are audited per affected ticket or line, with the series id. AI proposes and the user confirms (ADR 0007).
15. Seed: the demo seed gets one weekly series per mode (done in the implementation tickets, not here).

### Columns
| Column | Class |
|---|---|
| `Series.mode`, `interval`, `unit`, `weekdays`, `startTime`, `endTime`, `untilDate` or `count` | owned |
| `SeriesSkip.date` | owned |
| `Ticket.seriesId`, `Line.seriesId` | owned (FK) |
| `Ticket.occurrenceStart`, `Line.occurrenceStart` | owned instants (never a date column, ADR 0064 rule 1) |
| `detached` | owned |
| Occurrence start and end | owned instants on the ticket's lines, never derived from the rule after generation |
| Number of occurrences, next occurrence | derived |

## Consequences
- Supersedes ADR 0042: set it to "Superseded by 0069" when this is accepted.
- ADR 0057's "at most one invoice per ticket that is not VOID" becomes "a line is on at most one non-VOID invoice". Add an Addendum to 0057 and change `Invoice_ticketId_open_key` in a migration (`db-migration` skill).
- Files to change on acceptance:
  - `packages/core/CLAUDE.md`: series operations, the invoice-by-lines rule, edit scopes and the skipped list.
  - `packages/db/CLAUDE.md`: the new constraint or trigger on invoiced lines.
  - `apps/web/CLAUDE.md`: series form and scope picker (this, following, all).
  - `docs/specs/series.md` (new): rule, end, skips, modes, scopes, clash and skipped handling, billing. Also `docs/specs/tickets-statuses-and-states.md` for line `occurrenceStart`, and `docs/specs/payments.md` for per-period invoices.
  - `docs/domain-model.md` and `docs/artifacts/domain-model.html`: a **Target (ADR 0069)** note on Ticket, Line, Invoice and a new Series entity.
  - Root `CLAUDE.md`: a short differentiator line. Depends on ADR 0064 being built for the zone.
- Cost: occurrences are rows, so a weekly series holds about 52 tickets or line sets at a time (the 12-month horizon); the daily job adds the rest as time passes. `apps/worker/CLAUDE.md` lists the extension job. `FOLLOWING` splits create a second series row.
- Implementation tickets already exist: #452 (tickets mode, edit scopes, the extension job) and #453 (lines mode and per-period invoicing, with the migration). The demo seed is #457.

## Alternatives rejected
- **Keep ADR 0042 (no recurrence):** staff keep copying tickets; the stated target volume makes this the largest manual chore.
- **Only tickets mode:** loses "one quote, one deal" for standing bookings; **only lines mode:** loses per-occurrence status, quote and invoice that some venues need. Both are cheap once occurrences are rows, so the org picks.
- **Compute occurrences on read (RRULE only):** every consumer (calendar, holds, sheets, capacity) would need the engine, and per-occurrence edits need rows anyway.
- **Store an RRULE string:** needs a parser to validate and query; the three supported shapes are columns.
- **A series-level quote document in tickets mode:** a second snapshot of lines that the occurrence quotes already own (ADR 0051, 0052).
- **Lift the one-invoice rule entirely (many invoices over the same lines):** breaks the derived balance (ADR 0057); the per-line rule keeps it sound.
