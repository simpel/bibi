---
name: reservations
description: "Answer and act on table reservations: covers and needs for a day, free times for a party, create, change, seat, cancel, and hold back tables. Use when the user asks about bookings in a dining room, e.g. 'how many covers tonight', 'any allergies this evening', 'book a table for 4 on Friday at 19:00', 'block table 5 for lunch'."
allowed-tools: reservation_list reservation_get reservation_availability reservation_calendar reservation_create reservation_update reservation_cancel reservation_seat reservation_unseat reservation_complete reservation_markNoShow reservation_revertNoShow tableBlock_list tableBlock_create tableBlock_delete diningRoom_list diningService_list customer_list
metadata:
  title: "Reservations"
---

# Reservations

Goal: answer questions about a dining room's reservations and, when asked, propose changes.

## Words

- **Dining room**: a room of the organization with a table layout. `diningRoom_list` finds it.
- **Sitting**: a service with opening times, pace and turn times (for example lunch or dinner).
  `diningService_list` lists them.
- **Combination**: tables that may be pushed together for a larger party. A reservation may hold
  several tables.
- **Block**: tables held back for a period. Kind `BLOCK`: nobody books them. Kind `ONLINE_ONLY`
  (kept for walk-ins): guests cannot book them on the booking page, staff still can.
- **Online-only rules**: the guest rules (online window, online tables, no online-only blocks)
  apply only to guests on the booking page, not to staff.

## Answering questions

1. Resolve the room (`diningRoom_list`) and the day. Times are instants: turn "tonight" or
   "Friday" into a from/to range in the room's own time zone, never your own.
2. For "how many covers tonight" and "any allergies or dietary needs", make **one**
   `reservation_list` call for the range. Its `totals` hold the reservations, covers and summed
   needs (counts per value of the organization's own lists). Do not call `reservation_get` per
   reservation. Report the counts as they come; needs are numbers, never who.
3. Mention reservations with a warning or without a table when they matter to the question.

## Booking

1. Confirm **party size, date, time and the booker's name** before proposing a booking. Ask for
   whichever is missing, one short question at a time. Phone and email are optional.
2. Check the time with `reservation_availability` (room, local date, party size) first. Offer
   the available slots of the right sitting if the wish is not free.
3. Propose `reservation_create` with the confirmed values. It needs the user's approval; do not
   claim the booking exists until it is approved.
4. Changes (`reservation_update`) and state steps (`reservation_seat`, `reservation_unseat`,
   `reservation_complete`, `reservation_markNoShow`, `reservation_revertNoShow` when a guest
   marked as no-show comes late, `reservation_cancel`) are proposals too.
   Name the reservation (time, name, party) when you propose them.

## Warnings and refusals

- Staff overrides give **warnings**, not refusals: a time outside a sitting, over the pace
  limit, a room soft held for an order, outside the online window. The reservation is saved and
  the warnings are returned. Tell the user the warnings in plain words.
- A **taken table** or a **whole-room booking** is a refusal. Do not retry with the same
  tables; run `reservation_availability` again and suggest another time or table.

## Personal data

- Keep personal data minimal. A reservation has one booker (the buyer). Never ask for, store or
  repeat details about the other guests; needs are counts only.
- Do not copy the booker's phone or email into notes or other answers unless asked.

## Blocks

`tableBlock_list` shows held-back tables for a period; `tableBlock_create` and
`tableBlock_delete` (one block) are proposals. Say which tables, the kind and the period.
