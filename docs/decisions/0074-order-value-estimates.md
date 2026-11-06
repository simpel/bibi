# 0074 – An order's value: estimates as history, the accepted quote as the agreed value

- **Date:** 2026-11-01
- **Status:** Accepted
- **Related:** 0022 (quotes), 0051, 0052, 0054 (domain history), 0067 (boards), 0071 (view read models)

## Context
- The pipeline board should show what each phase is worth, and the figure should move when an order moves.
- An order's value changes: a first guess on an inquiry, re-estimates, then an agreed price. A phase can hold orders with and without an agreed price.
- We want to report how far the first estimate was from the agreed price, so every estimate must be kept.
- Priced lines already give a draft total (ADR 0052), but a fresh inquiry has no lines.

## Decision
1. The estimate is owned history: an append-only `OrderEstimate` table with value, time and author. The newest row is the current estimate, and `null` clears it. A row is appended only when the value changes.
2. No projection column. Nothing filters or joins on the estimate, so `Order` gets no column and no trigger. Reads take the newest row.
3. The agreed value is the accepted quote's frozen total excl. VAT. There is no manual agreed-value field.
4. A board card's estimate is the order's own estimate, else its priced lines' draft total. The fallback needs `program:read` and the confirmed value needs `quote:read` (ADR 0071).
5. A phase shows two sums: the confirmed value of orders with an accepted quote, and the estimate of the rest.

## Rejected
- An estimate column with a trigger: a projection to reconcile that buys nothing.
- A manual agreed-value field: it could disagree with the accepted quote.

## Consequences
- The deviation report is plain SQL on the first estimate against the accepted quote. Not built yet.
- The demo seed gives some orders estimates, including one re-estimate, and a seed check verifies the histories.
