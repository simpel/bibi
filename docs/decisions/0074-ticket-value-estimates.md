# 0074 – A ticket's value: estimates as history, the accepted quote as the agreed value

- **Date:** 2026-11-01
- **Status:** Accepted
- **Related:** 0022 (quotes), 0051 (single source of truth), 0052 (the line is the booking), 0054 (domain history), 0067 (boards), 0071 (view read models)

## Context
- The pipeline board should show what each phase is worth, so staff can see the money in each stage and watch it move when a ticket moves.
- A ticket's value changes over time. An inquiry gets a first guess before it has any lines. Staff re-estimate it as they talk to the customer. At the end there is an agreed price.
- One phase can hold tickets with an agreed price and tickets without one, for example a board phase that groups "Quote sent" and "Confirmed". The board has to show both kinds of value.
- Later we want to report how far the first estimate was from the agreed price, to see whether the estimates are off. That needs every estimate kept, not just the latest one.
- The priced lines already give a value: what a draft quote of them would total (ADR 0052). But a fresh inquiry has no lines, and staff often know the rough size of a deal before they plan any of it.

## Decision
1. **The estimate is owned history.** `TicketEstimate` is an append-only table (one row per change: `valueMinor`, `changedAt`, `changedBy`). The newest row is the current estimate; `null` clears it. `ticket.create` and `ticket.update` take `estimatedValueMinor` and append a row only when the value changes. `ticket.estimateHistory` lists the rows oldest first.
2. **No projection column.** Unlike the status (ADR 0054), nothing filters or joins on the estimate, so `Ticket` gets no column and no trigger. Reads take the newest row (`TicketDto.estimatedValueMinor`). Rejected: a `Ticket.estimatedValueMinor` column with a trigger. It adds a projection to reconcile and buys nothing.
3. **The agreed value is the accepted quote's total.** The board's `confirmedValueMinor` is the frozen `totalExclVatMinor` of the ticket's accepted quote (ADR 0022, 0052). Rejected: a manual "agreed value" field. The quote is already the agreed price, and a second field could disagree with it.
4. **The board's estimate falls back to the lines.** A `pipeline.board` card's `estimatedValueMinor` is the ticket's own estimate, else its priced lines' draft total. The lines belong to the program, so the fallback needs `program:read`. The confirmed value needs `quote:read` (ADR 0071).
5. **A phase shows two sums.** One is the confirmed value of its tickets with an accepted quote. The other is the estimate of the rest. Both are excl. VAT, in whole currency units, and they animate when a moved card refreshes the board.

## Consequences
- The deviation report is plain SQL: each ticket's first `TicketEstimate` against its accepted quote's total. It is not built yet.
- `TicketEstimate` is a domain history model in `packages/db` (org-scoped, append-only).
- The demo seed gives L3, F2 and F3 estimates. L3 is re-estimated once, and its accepted quote differs from both estimates. `checkDemoEstimates` checks that the histories match the data.
