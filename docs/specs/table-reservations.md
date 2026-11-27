# Table reservations

Target behaviour. Why: ADR 0119. Entities: `docs/domain-model.md` (Reservations). Click prototype: https://claude.ai/artifact/Pj5v22ngjq9kbuRX6DJCMv

## Words
- **Dining room** (`DiningRoom`): a room item (`SETUPS`) set up for table booking: its slug in the booking page address and the moment bookings are open until. UI: the item's name ("Kajen").
- **Tables**: the seated pieces (`ROUND`, `RECT`, not fixed) of a layout a sitting uses; a piece's `label` is its table number.
- **Sitting** (`DiningService`, UI "Sitting", sv "Sittning"): when a dining room takes bookings, with which layout and at what pace ("Lunch", "Dinner").
- **Combination** (`TableCombination`, sv "Kombination"): tables booked together for one party.
- **Reservation** (sv "Bordsbokning"): one party at one or more tables for a time range.
- **Block** (sv "Spärr"): a table held from booking for a time range; **online only** keeps it for staff (walk-ins, phone).
- **Booking page** (`BookingPage`, sv "Bokningssida"): the organization's public page for guests.

## Scenario
1. The admin sets Kajen up for table booking, numbers the 14 tables of its "Dinner" layout, joins 7 + 8 as "Long table" (6–8 people) and keeps 11 and 12 for walk-ins.
2. They create the sittings Lunch (Mon–Fri 11:30–14:00, layout Lunch) and Dinner (Tue–Sat 17:00–22:00, layout Dinner, 24 new guests per 15 minutes) and open bookings through 22 December.
3. They set up the booking page (logo, cover, accent colour, texts), publish it and paste the embed code on the venue's website.
4. A guest picks 2 people, Friday 4 December, 19:30, enters name, phone and email and one gluten-free, and books. Bibi assigns table 3 and emails a confirmation with a manage link.
5. The guest moves the booking to 20:00 from the link; later cancels it.
6. On the evening staff open Reservations, see the floor, seat parties, take a phone booking, and block two tables for a broken heater.
7. Sales tries to book Kajen whole with the layout "Banquet 80" that Friday; Bibi refuses while reservations exist that evening.

## Rules
### Opening bookable time
- A slot is offered online only when all hold:
  - inside a sitting on that weekday, within its season (`validFrom`/`validUntil`, instants set from local dates at the edge), and between its first and last booking time;
  - not on a closed `DiningServiceException` for that sitting and date, nor on a venue or room `HoursException` closed all day;
  - before the dining room's `openUntil` (an instant: the end of the last open day in the room's zone; null = only the sitting's `maxDaysAhead` limits);
  - at least `minMinutesAhead` from now and at most `maxDaysAhead` days ahead;
  - the party size is at most `maxOnlineParty`;
  - the covers starting in that slot plus the party stay within `maxCoversPerSlot` (null = no pace limit);
  - no HARD hold or manual block on the room overlaps `[start, start + turn time)`;
  - some online-bookable table or bookable combination fits the party and is free for the whole turn time.
- An exception may change one date's hours, layout or `maxCoversPerSlot`, or close the sitting. One exception per sitting and date.
- Turn time comes from the sitting's `turnTimes` (ordered rows of `{ upToParty, minutes }`; the last row covers larger parties).
- Staff (`reservation:write`) may book outside every rule except a table clash or a hard hold on the room: they get warnings (`OUTSIDE_SITTING`, `OVER_PACE`, `ROOM_SOFT_HELD`) and the reservation is saved. The booking window and `openUntil` bind only guests (`OUTSIDE_ONLINE_WINDOW` in availability).
- Times are instants; dates and minutes are read in the room's effective zone (`effectiveTimeZone`).

### Tables and combinations
- A table fits a party when `minCovers ≤ party ≤ maxCovers` (`maxCovers` null = its seat count, `minCovers` null = 1).
- A combination is two or more tables of the same layout, with its own `minCovers`/`maxCovers` (default: 1 and the sum of seats) and `onlineBookable`. A table may be in several combinations.
- Assignment: the smallest fitting free single table first (fewest wasted seats, then lowest label), then the smallest fitting free combination. Staff can choose any free tables.
- `onlineBookable` false on a table: guests never get it, alone or in a combination; staff can.
- Element ids survive `layout.save`. Deleting a table from a layout is refused (`CONFLICT`) while it has upcoming active holds; past holds keep pointing at it.

### Holds and blocks
- Each table of a reservation gets a `TableHold` (`RESERVATION`) for `[startsAt, endsAt)`. A database exclusion constraint refuses overlapping active holds on one table; core returns `CONFLICT` naming the table.
- A block is a `TableHold` of kind `BLOCK` (nobody may book) or `ONLINE_ONLY` (guests may not; staff may book over it, which ends the block for that span by splitting it).
- A whole-room block is the existing manual `Occupancy` on the room item.
- Cancelling, a no-show or erasure releases the holds (status `ARCHIVED`); completing keeps them.

### Room and tables
- A HARD `Occupancy` (an order line's or a task's hard hold, a buffer or a manual block) on the room hides overlapping slots and refuses table bookings for everyone (`CONFLICT`). SOFT holds only warn (`ROOM_SOFT_HELD`).
- A hard hold on a dining room (order line, task booking, manual block) that overlaps active table reservations is refused by the database trigger `room_reservations_guard` (`CONFLICT`: move or cancel them first), on every path that writes holds. Both paths take the same advisory lock on the room.

### Reservation lifecycle
- The lifecycle is `state`; `status` archives the row as everywhere.
- `PENDING_PAYMENT` → `BOOKED` (deposit paid) or released after 15 minutes (`CANCELLED`, reason `PAYMENT_TIMEOUT`).
- `BOOKED` → `SEATED` → `COMPLETED`; `BOOKED` → `NO_SHOW`; `BOOKED`/`PENDING_PAYMENT` → `CANCELLED`. `SEATED` may go back to `BOOKED` (undo) the same day.
- `source`: `STAFF`, `WEB` or `API`. `cancelledBy`: `GUEST` or `STAFF`.
- Guests change or cancel until `changeCutoffMinutes` before the start; afterwards the manage page shows the restaurant's phone.
- A guest change re-runs availability for the new time and party, keeping current tables when they still fit.

### Booker and kitchen
- One booker: `bookerName` (required), `bookerPhone` (required online), `bookerEmail` (required online), `note`. Optional `customerId`/`contactId` link a regular or a company (staff only).
- Dietary needs: `ReservationRequirement` counts against the organization's lists (ADR 0021). Online, guests count only the values of the lists the booking page offers (`BookingPage` guest lists, `BookingPageList` join rows, chosen under Administration → Table booking → Booking page); any other value is `VALIDATION`.
- 90 days after `endsAt` the nightly worker job `reservation.eraseBookers` (system only) erases name, phone, email and note (`erasedAt` set); counts, times and tables remain for statistics.

### Booking page
- One `BookingPage` per organization: `slug` (unique, lowercase), logo and cover (storage keys), `accentColor` (refused when contrast against white is under 4.5:1), intro and policy keyed by locale, contact phone and email, `embedOrigins` (https origins), `published`.
- Public URL `/book/<slug>/<room-slug>` (the dining room's slug); a room appears when it has an active sitting. The manage page is `/book/manage/<token>`.
- Fixed for everyone: layout, fonts, "Powered by Bibi".

## Operations
- Staff, every surface (parity): `reservation.list({ roomItemId?, from, to })`, `get`, `create`, `update`, `cancel`, `seat`, `unseat`, `complete`, `markNoShow`, `availability({ roomItemId, date, partySize })` (`reservation:read|write`); `tableBlock.list|create|delete` (`reservation:read|write`); `diningRoom.list|get|set`, `diningService.list|get|create|update|archive`, `diningServiceException.list|set|delete`, `tableCombination.list|save`, `bookingPage.get|update` (`diningSetup:read|write`). Table fields (`label`, `minCovers`, `maxCovers`, `onlineBookable`) go through `layout.save`.
- Permissions: `reservation` (bookings group; every member writes, managers and admins archive) and `diningSetup` (setup group; managers and admins).
- Public, `systemOnly`, outside the registry: `reservation.publicRooms({ slug })`, `publicAvailability`, `publicCreate`, `publicGet({ token })`, `publicChange`, `publicCancel`.
- Public API `/api/public/v1`, keyed by the published page's slug: `GET pages/{slug}`, `GET pages/{slug}/rooms/{room}/availability`, `POST pages/{slug}/rooms/{room}/reservations`; `GET|PATCH reservations/{token}` and `POST reservations/{token}/cancel` with the guest's token. Per-IP rate limit, open CORS, no cookies.
- Guest operations in core: `bookingPage.publicGet`, `reservation.publicAvailability|publicCreate|publicGet|publicChange|publicCancel` (system only), run through `runGuest` after `organizationOfPage` / `organizationOfToken` pinned the organization.
- Mails go through core's `ReservationMailer` port (apps inject `@bibi/mail`'s `sendReservationMail`) after the commit: confirmation, changed and cancelled from the commands, and a reminder 23–25 hours before from the hourly `reservation.sendReminders` job (once, `reminderSentAt`).

## Assistant and MCP
- Every staff operation is an MCP tool on the organization's MCP server (`/mcp`), so the in-app assistant and an organization's own MCP clients (Claude, partner agents, OAuth) can work with reservations as the signed-in member, with that member's permissions. Writes need approval (ADR 0007); each has an approval label ("Book table 3 for 2, Fri 19:30, Anna Lind").
- Typical prompts the tools must answer in one or two calls: "How many covers tonight, and any allergies?" (`reservation.list` with needs totals), "Is there room for 6 on Saturday at 19:00?" (`reservation.availability`), "Book Andersson, 4 people, tomorrow 18:30, phone 070…" (`reservation.create`), "Move the Nilsson booking to 20:00" (`reservation.update`), "Block the window tables Friday evening" (`tableBlock.create`), "Close lunch on 24 December" (`diningServiceException.set`), "Open bookings through March" (`item.update`).
- `reservation.list` returns per-day totals (covers per sitting, needs counts) beside the rows, so summaries need no second call. Search finds reservations by booker name and phone (`Embeddable` off: booker data is personal and erased; plain text search only).
- Generative UI in `@bibi/ui` for every result type: a reservation card, a day list (rows + totals), an availability grid of times, a block card, a sitting card.
- A system skill "Reservations" tells the assistant the words (sitting, combination, block), that staff overrides warn rather than refuse, and to confirm party size, date, time and name before proposing a booking.

## Surfaces
- **Reservations** (sidebar, `reservation:read`): `/reservations?room=&date=` with List and Floor tabs, covers per sitting, needs summary, **Create reservation** and **Block tables** on the title row. `/reservations/{id}` the reservation page.
- **Booking settings** (`diningSetup:read`): `/settings/booking/{roomId}` with tabs Sittings, Exceptions, Tables, Booking page.
- Public pages under `(public)`: no app shell, `noindex`, `no-referrer`, `frame-ancestors` from `embedOrigins`.
- Email: confirmation, change, cancellation and a reminder 24 hours before, all with the manage link and the booking page's logo and accent.

## Not in this version
Deposits (ADR 0119 decision 10 deferred: large parties call; `PENDING_PAYMENT` and the sitting's deposit columns stay unused) waitlist, SMS, custom domains or CSS, OAuth for partners, per-table pricing, recurring blocks.
