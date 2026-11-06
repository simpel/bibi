# 0023 – Customer pricing

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- Corporate customers often book the same setup regularly at an agreed lower price.
- The first design copied the price onto each line, which makes later price changes impossible to reason about.

## Decision
1. A customer can point to a price list with validity and either a general discount or a price per item.
2. A line's price is derived: line override, then the customer's valid price list, then the item's price. A quote or invoice freezes it when sent (ADR 0052).
3. Recurrence is not part of the product (ADR 0042).

## Rejected
- Copying the price onto the line at creation: the same fact would live in two places and drift (ADR 0051).

## Consequences
- A price list change affects unsent lines at once and never affects frozen quotes or invoices.
