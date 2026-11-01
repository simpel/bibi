# 0080 – The dashboard looks ahead, Financials looks back

- **Date:** 2026-11-01
- **Status:** Accepted (approved by the user on 2026-11-01)
- **Related:** 0079 (dashboard summary, amends decisions 5 and 6), 0077 (financials, amends), 0041 (three views), 0044 (hold expiry), 0071 (view read models), 0064 (time), 0003 (parity)

## Context
- After ADR 0079 the two pages do the same job. Both have a from/to period picker, both show invoiced and received for that period, and both draw the same monthly chart (`EconomyPanel` reuses `FinanceKpis` and `MonthlyChartCard`).
- Outcomes and utilisation on the dashboard also look back over the period, so the dashboard reads as a second report page.
- The two audiences want different things. Staff opening the app want to know what to do today and how the coming weeks look. A manager or bookkeeper wants to know how a past period went and to close it in the accounting system.

## Decision
1. **Split by time direction.** The dashboard shows now and what is ahead. Financials shows what has happened plus the open receivables and the SIE export. Neither page shows the other's figures. The only crossing is a link.
2. **The dashboard has no period.** `/dashboard` is a single route with no dates in the path. The horizon is fixed at **28 days from today** in the organization's zone (`effectiveTimeZone`, ADR 0064). `dashboard.summary` takes no period input.
3. **Dashboard panels:**
   - **Pipeline** per open status, now (unchanged from ADR 0079 decision 2).
   - **Needs attention**: a list, each row linking to its source.
     - Tickets whose `holdsUntil` falls in the next 7 days and that still have lines in an `expires` state (`ticket:read`).
     - The latest version of a sheet that has not been sent, for tickets with lines starting within the horizon (`sheet:read`).
     - Overdue invoices: count and total, linking to Financials (`finance:read`). This is the dashboard's only money figure.
   - **Coming up**: tickets with lines starting within the horizon, by day (`ticket:read`).
   - **Utilisation ahead** per bookable item type over the horizon, same definition as ADR 0079 decision 4 (`item:read`).
   - **Booked ahead**: accepted quotes not yet invoiced, by event month (`quote:read`). This was "forward booked" on Financials.
4. **Financials keeps the period** (`/financials/{from}/{to}`) and everything it owns today, apart from forward-booked value. It gains **won and lost per month** with the win rate (`quote:read`), moved from the dashboard and defined as in ADR 0079 decision 3. Its "now" section stays: outstanding, overdue, aging, the overdue table and the export history.
5. **Ownership moves with the panels, so no fact is computed in two places.** `outcomes` leaves `dashboard.summary` and becomes a part of `finance.overview`. `forwardBooked` leaves `finance.overview` and becomes a part of `dashboard.summary`. Each part keeps its own `read` gate as a view read model (ADR 0071). Both operations stay on web, GraphQL, REST and MCP (ADR 0003).
6. **The dashboard does not call `finance.overview`.** The overdue count and total come from `dashboard.summary`, gated on `finance:read`, read from the same receivable rows Financials reads from.

## Consequences
- `dashboard.summary` changes its input and shape, which is a breaking change on GraphQL, REST and MCP. Its generative UI card changes with it.
- `/dashboard/{from}/{to}` redirects to `/dashboard`. `EconomyPanel` and the dashboard's `PeriodSwitcher` are removed.
- `finance.overview` gains `outcomes` and loses `forwardBooked`. `ForwardBookedCard` moves to the dashboard feature.
- Updates on acceptance: `docs/specs/dashboard.md`, the finance section of `docs/domain-model.md` and its artifact, and addenda on 0079 and 0077.
- The demo seed needs tickets with `holdsUntil` in the next week, unsent sheets for upcoming tickets, and an overdue invoice. Without them every attention row would be empty.

## Alternatives rejected
- **Split by role (members get the dashboard, managers get Financials).** Rejected: both pages would still be period reports. Permissions already hide what a role may not read (ADR 0071).
- **A selectable horizon (7, 28 or 90 days).** Rejected for now: a picker on the dashboard brings back the shared period model this decision removes. It can be added if 28 days proves wrong for some venues.
- **One page with tabs.** Rejected: staff lose a starting page that answers "what do I do today".
- **Keep `forwardBooked` in `finance.overview` and call it from the dashboard too.** Rejected: the dashboard would need a period again, and one figure would have two homes.

## Addendum 2026-11-01 – one page with tabs (ADR 0086)
- The page split and the fixed 28-day window are superseded: Financials and Workload are two tabs of one dashboard with one range picker. "Needs attention" keeps its 28-day look ahead for unsent sheets.
- The ownership moves in point 5 stay: won and lost are `finance.overview`, booked ahead is `dashboard.summary` (now limited to months in the range).
