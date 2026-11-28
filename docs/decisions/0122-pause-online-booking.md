# 0122 – Pausing online table booking

- **Date:** 2026-11-27
- **Status:** Proposed
- **Related:** 0064, 0119

## Context
- Floor staff sometimes must stop guests booking online at once: the kitchen is in trouble, a private party takes the room, a heater breaks. Staff keep booking by phone and at the door.
- Today the only levers are a `DiningServiceException` per sitting and date, a venue or room `HoursException`, and moving `openUntil`. All are slow, tied to dates, and easy to forget to undo.
- A room-wide `Occupancy` block would stop staff too, which is wrong.

## Decision
1. **A dining room gets one owned instant, `onlinePausedUntil`.** While it is in the future, guests cannot book, change or cancel-and-rebook online. Staff booking is unaffected.
2. **Pause until a time, or until resumed.** "Until resumed" stores a far-future instant (`9999-12-31`). A paused room resumes by itself when the time passes; nothing needs a job.
3. **The public page and API say it plainly.** The room shows as closed with the booking page's contact details. Availability returns no slots with the reason `PAUSED`. A guest's existing reservation can still be viewed and cancelled from the manage link.
4. **Set through `diningRoom.set`** (`diningSetup:write`) as a nullable `onlinePausedUntil`, on every surface, with the usual audit and log rows. It is a quick toggle in the day view's menu and a switch on the room's setup page.

## Rejected
- **Reusing exceptions or hours exceptions:** per date and sitting, slow in a rush, and they change what staff see.
- **A boolean:** it is forgotten, and never resumes by itself.
- **A room `Occupancy` block:** it refuses staff bookings too.
- **Closing the booking page:** it pauses every room of the organization, and loses the message.

## Consequences
- One nullable column on `DiningRoom`; additive and cheap to remove.
- Online availability checks one more condition, next to the booking window.
- A paused room needs a visible state in the day view so staff know guests cannot book.
