# 0080 – The dashboard looks ahead, Financials looks back

- **Date:** 2026-11-01
- **Status:** Accepted; the page split is superseded by ADR 0086, the ownership moves in point 5 stand
- **Related:** 0079 (amends decisions 5 and 6), 0077 (financials), 0071 (view read models), 0064 (time), 0003 (parity)

## Context
- After ADR 0079 the dashboard and Financials did the same job: both had a period picker, both showed invoiced and received, and both drew the same monthly chart.
- Staff opening the app want to know what to do today. A manager or bookkeeper wants to know how a past period went.

## Decision
1. Split by time direction. The dashboard shows now and ahead, Financials shows what has happened plus open receivables and the export. Neither shows the other's figures.
2. The dashboard has no period. The horizon is a fixed 28 days from today in the organization's zone.
3. Dashboard panels: pipeline now, needs attention (expiring holds, unsent sheets, overdue invoices as the only money figure), coming up, utilisation ahead and booked ahead.
4. Financials keeps the period and gains won and lost per month with the win rate.
5. Ownership moves with the panels, so no fact is computed in two places. `outcomes` moves from `dashboard.summary` to `finance.overview`. `forwardBooked` moves the other way.
6. The dashboard does not call `finance.overview`. Overdue count and total come from `dashboard.summary`, gated on `finance:read`.

## Rejected
- Split by role. Both pages would still be period reports; permissions already hide what a role may not read.
- A selectable horizon. It brings back the shared period model this removes.
- One page with tabs. Reconsidered and chosen in ADR 0086.
- Keep `forwardBooked` in `finance.overview` and call it from the dashboard. One figure would have two homes.

## Consequences
- `dashboard.summary` changed input and shape, a breaking change on GraphQL, REST and MCP.
- Candidate to merge into a spec: `docs/specs/dashboard.md`.
