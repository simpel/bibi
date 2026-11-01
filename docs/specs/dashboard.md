# Dashboard

Spec for `/dashboard` (ADR 0041, 0079, 0080). The dashboard has no period: it always shows today and the next 28 days in the organization's zone (ADR 0064). `/dashboard/{from}/{to}` redirects to `/dashboard`. One read model, `dashboard.summary()`, answers the whole page on web, GraphQL, REST and MCP. What has already happened (invoiced, received, won and lost) is on Financials (`finance.overview`, ADR 0077).

## Panels
| Panel | Source | Needs | Covers |
| --- | --- | --- | --- |
| Pipeline: open tickets, estimated and confirmed value per open status | `statuses` | `ticket:read` | now |
| Needs attention: holds expiring within 7 days | `attention.expiringHolds` | `ticket:read` | next 7 days |
| Needs attention: unsent sheets for upcoming tickets | `attention.unsentSheets` | `sheet:read` | horizon |
| Needs attention: overdue invoices, count and total (links to Financials) | `attention.overdue` | `finance:read` and `payment:read` | today |
| Coming up: tickets with lines starting in the horizon | `comingUp` | `ticket:read` | horizon |
| Utilisation per bookable item type | `utilisation` | `item:read` | horizon |
| Booked, not yet invoiced: accepted quotes per event month | `bookedAhead` | `quote:read` | all |

A panel the caller may not read is not drawn, or says so (ADR 0071); a panel with no data shows an empty state. Customer names in the lists need `customer:read`, else the row shows only the ticket reference.

## Definitions
- **Horizon**: `from` = today in the organization's zone (the context clock, ADR 0064), `to` = today + 27 days, both inclusive; instants `[start of from, start of to + 1 day)`.
- **Open status**: `closes = false`, in position order. Counts and values group by status id, never by name (ADR 0021).
- **Value**: estimated = the ticket's own estimate, else its priced lines (needs `program:read`), summed over tickets without an accepted quote; confirmed = the accepted quotes' totals (needs `quote:read`), as on the board. Excl. VAT, minor units (ADR 0074).
- **Expiring hold**: an active ticket in an open status whose `holdsUntil` falls from the start of today to the start of the day 7 days ahead, with at least one active line in an `expires` state (what `ticket.expireHolds` acts on, ADR 0044). Soonest first.
- **Unsent sheet**: the newest version of a ticket's sheet per definition, when its `sentAt` is null, for an active ticket in an open status with a line starting in the horizon. Soonest event first.
- **Overdue**: sent invoices with money open and at least one whole day past their due date, as on Financials' aging.
- **Coming up**: active tickets in an open status with active lines starting in the horizon, by their first start; at most 50.
- **Utilisation**: per bookable item type (capability `BOOKABLE`), `bookedMinutes / openMinutes` over the horizon. Open = each active item's own hours, else its venue's, else the office day 08–18 (as the calendar draws), per local day in the item's zone. Booked = merged `Occupancy` of the item (any type) inside those hours.
- **Booked ahead**: the newest accepted quote of each active ticket with no sent invoice, by the month of the event's first line (else the acceptance).

## Limits
- The horizon is fixed at 28 days; a picker was rejected (ADR 0080). Everything is derived on read; nothing is stored.
- No staff-load view yet.
