# 0023 – Customer pricing

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- Corporate customers often book the same setup regularly at an agreed lower price.
- The domain model has a price list with customer-specific discount.

## Decision
- Customer price: `PriceList` with `customerId`, validity and either a general discount (%) or a price per item. The customer points to the price list.
- Lines copy the price when they are created. A changed price list affects only new lines.
- Recurrence is not part of the product (ADR 0042).

## Consequences
- Entities: `PriceList` and `PriceListItem`.
