# 0052 – The line is the booking; the quote is a snapshot of lines

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0051 (single source of truth), 0023 (customer pricing), 0043, 0044

## Context
- What a customer has booked existed twice: as a program line and as a quote line. After expansion they changed independently, so a quote could price something that was not booked.
- Quantity existed three times on the order and its lines.
- Quotes, sheets and invoices need one list to read, or they disagree.

## Decision
1. The line is the only record of what is booked and sold. Every priced thing on an order is a line, including untimed ones such as a fee. A line without an item is allowed for unpriced program points.
2. Commercial terms live on the line as overrides. `null` means inherit: line, then the customer's price list, then the item (VAT: line, item, venue default).
3. The quote is a snapshot of lines. A draft quote stores no lines and is a derived view. Sending freezes one quote line per priced line, linked by `programItemId`, with price, VAT and totals at that moment. A sent quote is never edited. Change markers and "differs from the accepted quote" are derived, never stored.
4. Packages expand into lines only. No quote lines are created directly.
5. One headcount. The order owns an estimated and a guaranteed headcount. A line quantity of `null` inherits the order's current headcount.
6. Invoices are snapshots of lines too (ADR 0057).
7. Untimed lines never hold anything. A line holds an item only when the item is `BOOKABLE` and the line has a time.
8. Alternatives are line groups (pick exactly one). Choosing moves the other options to their released state. A hard hold on more than one option of a group is refused.
9. `ProgramItem` is renamed `Line`.

## Rejected
- Keeping quote lines as an independently edited copy: they drift from what is booked.

## Consequences
- Price and quantity changes are line operations on every surface. `quote.update` no longer takes lines.
- Sheets, quotes and invoices read one list of lines.
- A bundle expands into one priced bundle line plus part lines that do not count in the total. Bundle VAT is frozen as one row per rate (ADR 0059).
- The rename was one large mechanical change with no data to migrate.
