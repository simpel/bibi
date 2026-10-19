# 0052 – The line is the booking; the quote is a snapshot of lines

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0051 (single source of truth), 0023 (customer pricing), 0043, 0044

## Context
- What a customer has booked exists twice:
  - `ProgramItem` (line): item, time, setup, quantity, state, hold.
  - `OrderLine` on a quote: item, quantity, price, VAT, tags. Its link to the line is marked "later".
- Expanding an item onto a ticket creates both, and from then on they change independently. A line can be moved, removed or doubled without the quote noticing, and a quote line can be priced for something that is not booked.
- Quantity exists three times: `Ticket.quantity`, `Ticket.estimatedHeadcount` and the line's `quantity` (copied from the ticket by templates with `PER_HEADCOUNT`).

## Decision
1. **The line (`ProgramItem`) is the only record of what is booked and sold.** Every priced thing on a ticket is a line, also things without time or hold (a parking fee, a flat delivery charge). A line without an item is allowed for unpriced program points (a break).
2. **Commercial terms live on the line as overrides.** `unitPriceMinor`, `discountPercent` and `vatRatePercent` are `null` = inherit. The effective price is derived: line override → the customer's valid price list → the item's price. The effective VAT is derived: line override → item → venue default.
3. **The quote is a snapshot of lines.**
   - A `DRAFT` quote stores no lines. It is a live, derived view of the ticket's priced lines.
   - `quote.send` freezes the snapshot: one `OrderLine` per priced line with `programItemId`, the effective price, VAT, tags and totals at that moment. A sent quote is never edited.
   - `Quote.totalExclVatMinor` / `totalInclVatMinor` are part of the frozen snapshot. A draft's totals are derived.
   - Change markers (`ADDED`, `CHANGED`, `UNCHANGED`, removed) pair snapshot lines by `programItemId`, not by item and order.
   - "Differs from the accepted quote" is derived: the current lines compared with the accepted snapshot. It is shown on the ticket, never stored.
4. **Packages expand into lines only.** Choosing options and components creates lines. No quote lines are created directly.
5. **One headcount.** `Ticket.quantity` is removed. The ticket owns `estimatedHeadcount` and `guaranteedHeadcount` (a later, binding figure). A line's `quantity` is `null` = inherit the ticket's current headcount (guaranteed if set, else estimated). `TicketTemplateLine.quantityBasis = PER_HEADCOUNT` becomes `quantity = null`.
6. **Invoices are snapshots too** (ADR 0057). They snapshot the lines at invoicing, the same way a quote does.
7. **Untimed lines are allowed.** `startsAt` / `endsAt` are optional. A line holds an item only when the item is `BOOKABLE` and the line has a time. An untimed line (a fee, a delivery charge) never holds anything and is not drawn on the calendar.
8. **Alternatives are line groups.** Lines on a ticket can form an `AlternativeGroup` (pick exactly one), e.g. "Room A or Room B". The snapshot shows the group with each option's price; the quote total counts the group's cheapest option as "from" until one is chosen. Choosing (by staff, or by `quote.accept` with the chosen option) moves the other options to their type's released state, which releases their holds (ADR 0053). Same idea as `ItemChoiceGroup`, applied to a ticket's lines.
9. **`ProgramItem` is renamed `Line`** (model, operations `line.*`, GraphQL, REST, MCP, i18n). The existing `line.changeState` / `line.followPhase` already use the name.

## Consequences
- `quote.update` no longer takes lines. Price and quantity changes are line operations (`programItem.update`) on every surface (parity, ADR 0003).
- `OrderLine` gets `programItemId` (required) and loses its independent editing path. It may be renamed `QuoteLine` in the same change.
- Sheets, quotes and invoices now read one list of lines, so they cannot disagree about what is booked.
- Demo seed: quotes are created by adding lines, then sending. `docs/demo-seed.md` and the seed checks change.
- `Line` (today `ProgramItem`) grows three nullable price columns and nullable times. The rename is one large mechanical change with no data to migrate.
- `AlternativeGroup` is new: `ticketId`, `name`, `chosenLineId` (null until chosen). A line has `alternativeGroupId`. Choosing is a command (`alternativeGroup.choose`) on every surface.
- Soft holds on every option of a group are the normal case (the customer has not chosen). A hard hold on more than one option of a group is refused.
