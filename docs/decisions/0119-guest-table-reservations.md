# 0119 – Guests book restaurant tables themselves

- **Date:** 2026-11-26
- **Status:** Accepted (the user, 2026-11-26)
- **Related:** 0003, 0015, 0021, 0028, 0032, 0050, 0053, 0063, 0064, 0099, 0103, 0106, 0108

## Context
- Venues with a restaurant need classic table booking. A guest picks a party size and a time on the venue's own booking page, or a partner site books through an API. The guest can later change or cancel. Without this, Bibi loses venues that want conference and restaurant booking in one tool.
- Today Bibi is staff-only: guests see only the payment page, and nothing books a single table.
- A dining room is already a room item with a floor plan and layouts (ADR 0099, 0103), and its tables are layout elements with seats.
- An order line can book the whole room with a layout. That must block tables, and tables must block it.
- Staff must control when guests can book. They decide which dates are open, the hours and sittings, closed days, and which tables or times are held back.

## Decision
1. **Guests use Bibi directly for table booking.**
   - Each dining room has a public booking page and a manage link. The link carries an unguessable token, as on `Payment`. With it, a guest books, changes and cancels within the venue's rules.
   - Partner sites use a public API keyed by the published page's slug (as built, 2026-11-26: the slug is public anyway, so a separate publishable key adds nothing). It allows reading the page, checking availability and creating bookings; changes and cancels need the guest's token.
2. **The booking page is lightly white-labelled per organization.**
   - The organization sets a `BookingPage`: a slug, logo, cover image (via storage, ADR 0063), one accent colour (refused when it lacks contrast), intro and policy texts in sv and en, and contact details.
   - It can be embedded in an iframe from domains the organization lists.
   - Layout, fonts and the "Powered by Bibi" line stay fixed. There are no custom domains or CSS.
3. **A `Reservation` is its own entity, not an order.** It has a fixed lifecycle: `PENDING_PAYMENT`, `BOOKED`, `SEATED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`. The organization's order statuses do not apply, so the public API and guest emails keep a stable meaning.
4. **Staff open bookable time with services.**
   - A `DiningService` belongs to a room. It has:
     - weekdays and hours, an optional season (`validFrom`/`validUntil`), and the dining layout,
     - the slot interval and turn times by party size,
     - a covers limit per slot,
     - the booking window, the change cutoff, the largest online party, and deposit rules.
   - The dining room's `openUntil` releases dates to guests. Nothing after it is bookable online.
   - A dated `DiningServiceException` closes a service or overrides its hours, layout or covers for one day. Venue and item `HoursException` closed days apply too.
   - Online availability treats hours and services as strict. Staff may book outside them with a warning, as ADR 0064 rule 11 allows.
5. **Tables are elements of a dining layout.**
   - The seated elements of a layout a sitting uses are its tables. Each table has a label, cover limits and an `onlineBookable` flag.
   - Element ids become stable across `layout.save`: it upserts them instead of replacing them.
   - A `TableCombination` joins tables for a larger party. A table that can be split is drawn as its pieces plus their combination.
6. **Bookings and blocks share one table-hold row.**
   - A `TableHold` holds one table for a time range, either for a reservation or as a staff block with a note.
   - A Postgres exclusion constraint guards it, so two parties never share a table, and a blocked table is never booked.
   - A block can be `ONLINE_ONLY`: the table is held back from guests, and staff can still seat walk-ins at it.
   - A whole room or time span is blocked with the existing manual `Occupancy` on the room item.
7. **Room and tables block each other.**
   - A HARD hold or manual block on the room hides and refuses table bookings in its window.
   - A whole-room order line that overlaps active reservations is refused with `CONFLICT`.
   - Both write paths take an advisory lock per room.
8. **One booker, no guest data.**
   - A reservation stores one booker's name, phone and email: the buyer, like a contact.
   - Dietary needs are counts against the organization's own lists; ADR 0021 stands.
   - A worker job erases the booker fields 90 days after the visit (ADR 0032).
9. **The public surface is anonymous and narrow.**
   - Public operations are `systemOnly`, sit outside the registry, and run as SYSTEM. Each runs with a narrowed permission set, pinned to the organization from its slug, key or token, as `payment.getPublic` does.
   - They are exempt from parity (ADR 0003), as platform operations are (ADR 0015).
   - An IP rate limit guards the page and the API, and the page also has a captcha.
   - The staff operations, including services, exceptions, blocks and booking-page settings, keep full parity.
10. **A deposit goes through a private order.** *Deferred (the user, 2026-11-27): not built in the first release; large parties call the restaurant (`maxOnlineParty`). The sitting's deposit columns stay unused until then.*
    - When a party size triggers the venue's deposit rule, the reservation creates a private order with a deposit, and the guest pays on the existing payment page.
    - Accounting, refunds and VAT on advance payments follow ADR 0093, 0106 and 0108.
    - A booking waiting for payment holds its tables for 15 minutes.

## Rejected
- **Reservations as orders.** Each would carry a pipeline, quotes and accounting, which is noise at 200 covers a night. Orders also require a customer and a contact.
- **Tables as items.** They would duplicate the drawing, and one fixed table set per room cannot follow the layout in use.
- **Covers per slot only.** It cannot stop two parties from being placed at the same table. Here it is a pacing limit on top of tables.
- **Blocks as their own table beside the holds.** Two tables need two overlap checks that can race. One exclusion constraint covers both.
- **Free-form theming or custom CSS.** It is hard to support and easy to make inaccessible. One accent colour, a logo and texts cover what venues ask for.
- **Public operations in the registry.** Parity would put anonymous commands on GraphQL and MCP, where they mean nothing.

## Consequences
- The root `CLAUDE.md` product line "Guests and customers never use the app" changes to allow table booking.
- **New models:** `BookingPage`, `DiningRoom`, `DiningService`, `DiningServiceException`, `Reservation` with `ReservationRequirement`, `TableHold`, and `TableCombination` with its members.
- **Changed models** (as built, 2026-11-26):
  - A layout's seated pieces become tables once a sitting uses it; no dining flag.
  - `FloorElement` gains cover limits and `onlineBookable`; its existing `label` is the table number.
  - A `DiningRoom` row per room holds its slug and `openUntil` (an instant, ADR 0064), instead of a column on the item.
- Bibi sends mail to customers for the first time: confirmation, change, cancel and a reminder. The mail uses the booking page's logo and accent colour.
- The parity test gets a public exemption list. `packages/api` gets a public router, publishable keys and an IP rate limit.
- **Open for the accountant:** whether a kept no-show deposit is revenue or a fee (`docs/specs/payments.md`).
