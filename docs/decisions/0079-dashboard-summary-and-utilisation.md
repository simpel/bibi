# 0079 – Dashboard summary, won/lost outcomes and utilisation

- **Date:** 2026-11-01
- **Status:** Accepted (scope and choices approved by the user on 2026-11-01); decisions 5 and 6 superseded by ADR 0080
- **Related:** 0041 (three views, amends), 0077 (financials, amends), 0071 (view read models), 0054 (domain history), 0053 (holds), 0064 (time), 0074 (estimates), 0021 (configurable domain)

## Context
- The dashboard (ADR 0041) shows open and closed counts and one badge per board column. ADR 0041 names a `dashboard.summary` operation that was never built.
- Staff want the pipeline in value, a history of won and lost tickets and how loaded their rooms and staff are. ADR 0077 put money on Financials only.
- A status has no won or lost marker; `closes` is the only terminal flag, and "Lost" is just an organization's own name for a closing status (ADR 0021).

## Decision
1. **One view read model, `dashboard.summary({ from, to })`**, on web, GraphQL, REST and MCP (ADR 0003, 0071). Permission `ticket:read`; every part from another feature is `null` without that feature's `read`. Nothing is stored; everything is derived on read.
2. **Pipeline by status.** One row per open ticket status (statuses with `closes = false`, in position order): ticket count, confirmed value (accepted quotes) and estimated value of the tickets without an accepted quote, excl. VAT, as on the board (`cardValues`, ADR 0074). Grouped by status id and flags, never by name.
3. **Won and lost by proxy.** A ticket enters a closing status once (nothing leaves one, ADR 0054); the month of that `TicketStatusChange` is its outcome month. **Won** = the ticket has an accepted quote or a sent invoice (an event can be invoiced without a quote, ADR 0077), **lost** = it has neither. Value: the accepted quote's total, else the ticket's estimate (a sent invoice without a quote counts at its estimate or lines). No schema change. A real outcome flag on `TicketStatus` stays an option if the proxy proves too coarse.
4. **Utilisation per item type.** For each bookable item type (capability `BOOKABLE`), over the period: `bookedMinutes` = hold time (`Occupancy`, ACTIVE, any type) inside the open hours of its active items, merged per item so overlapping holds count once; `openMinutes` = the items' open hours (own hours, else the venue's, else the office day the calendar uses); `rate = bookedMinutes / openMinutes`, `null` when nothing is open. Needs `item:read`. Staff load (open tickets per assignee) is out of scope.
5. **Money panel.** The dashboard may show money (amends the rejections in ADR 0041 and 0077). It is not a new operation: the page calls `finance.overview` for the same period and shows the panel only when the caller has `finance:read`.
6. **Period** is in the path (`/dashboard/{from}/{to}`, ADR 0064), at most 24 months, default the last 6 months; it drives won/lost, utilisation and money. The pipeline tiles are always "now".

## Consequences
- `dashboard.summary` and its web, GraphQL, REST and MCP surfaces; chart components in `@bibi/ui`; demo seed gets closed tickets in several months.
- Utilisation counts holds on the item itself; units allocated through a pool (ADR 0059) are counted through their own holds.

## Alternatives rejected
- **A `WON | LOST` flag on `TicketStatus` now.** Rejected for now: needs an ADR and migration of every organization's statuses, and the quote proxy answers the same question.
- **Money inside `dashboard.summary`.** Rejected: it would duplicate `finance.overview` and its `finance:read` gate.
- **Staff load as the allocation rate.** Rejected for the first version: utilisation answers "how full are we" for rooms and staff alike, since staff are items of a type (ADR 0059).

## Addendum 2026-11-01 – the dashboard looks ahead (ADR 0080)
- Decisions 5 and 6 are superseded: the dashboard has no period and no money panel. It shows today and the next 28 days (`/dashboard`; the old path redirects), and its only money figure is the overdue count and total in "Needs attention".
- Won and lost (decision 3) moved to `finance.overview` and Financials, unchanged in definition. Utilisation (decision 4) now covers the 28-day horizon.
