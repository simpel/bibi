# 0023 – Recurring bookings and customer pricing

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- Corporate customers often book the same setup regularly, for example a meeting room on the first Tuesday of every month, at an agreed lower price.
- The domain model has a price list with customer-specific discount, but no way to express series.

## Decision
- `BookingSeries` contains customer, template (items incl. room, setup and times) and a recurrence rule. The rule is a subset of RFC 5545 RRULE: `FREQ=WEEKLY|MONTHLY`, `INTERVAL`, `BYDAY` (incl. "1TU"), `BYMONTHDAY`, `COUNT` or `UNTIL`. It is validated with Zod.
- Each occurrence is an ordinary `Booking` with `seriesId` and `occurrenceIndex`, so statuses, owners and occupancy work as for other bookings.
- Occurrences are created when the series is created, at most 12 months or 52 occurrences ahead. Conflicts do not abort the series. Conflicting occurrences are marked and returned so the user can choose a room or time for those specifically.
- Changes are made either for "only this occurrence" or for "this and following". Cancelling a series cancels all upcoming occurrences.
- Customer price: `PriceList` with `customerId`, validity and either a general discount (%) or a price per item. The series and the customer point to the price list.
- Order lines copy the price when they are created. A changed price list affects only new lines.
- A quote can cover a whole series. The lines are shown per occurrence and summed.

## Consequences
- New entities: `BookingSeries`, `PriceList` and `PriceListItem`.
- Calendar views must show which bookings belong to a series.
- Generation further ahead than 12 months is done by the scheduler in a nightly job (ADR 0027).
