# Dashboard

Spec for `/dashboard/{from}/{to}` (ADR 0041, 0079). The period is in the path (ADR 0064); `/dashboard` redirects to the last six months. One read model, `dashboard.summary({ from, to })`, answers the whole page on web, GraphQL, REST and MCP; the money panel reuses `finance.overview` (ADR 0077).

## Panels
| Panel | Source | Needs | Period |
| --- | --- | --- | --- |
| Pipeline: open tickets, estimated and confirmed value per open status | `dashboard.summary.statuses` | `ticket:read` | now |
| Won and lost per month, win rate | `dashboard.summary.outcomes` | `quote:read` | period |
| Utilisation per bookable item type | `dashboard.summary.utilisation` | `item:read` | period |
| Money: invoiced, received, outstanding, overdue, monthly chart | `finance.overview` | `finance:read` | period |

A panel the caller may not read is not drawn (ADR 0071); a panel with no data shows an empty state.

## Definitions
- **Open status**: `closes = false`, in position order. Counts and values group by status id, never by name (ADR 0021).
- **Value**: estimated = the ticket's own estimate, else its priced lines (needs `program:read`), summed over tickets without an accepted quote; confirmed = the accepted quotes' totals (needs `quote:read`), as on the board. Excl. VAT, minor units (ADR 0074).
- **Outcome month**: the month, in the organization's zone, of the ticket's change into a closing status (`TicketStatusChange`, ADR 0054).
- **Won / lost**: won = the ticket has an accepted quote or a sent invoice; lost = it has neither. Won value = the accepted total, else the estimate; lost value = the estimate.
- **Win rate**: `won / (won + lost)` over the period, shown in the UI only.
- **Utilisation**: per bookable item type (capability `BOOKABLE`), `bookedMinutes / openMinutes`. Open = each active item's own hours, else its venue's, else the office day 08–18 (as the calendar draws), per local day in the item's zone. Booked = merged `Occupancy` of the item (any type) inside those hours.

## Limits
- At most 24 months. Everything is derived on read; nothing is stored.
- No staff-load view and no won/lost reasons yet; a `WON | LOST` flag on statuses is an option if the quote proxy is too coarse (ADR 0079).
