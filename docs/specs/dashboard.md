# Dashboards

Spec for `/data/{dashboard}/{from}/{to}` (ADR 0041, 0079, 0080, 0086). One page, **Dashboards**: a header with the title, a preamble, the one range picker and two dashboards as tabs, **Financials** and **Workload**; the open dashboard fills the white section below. The dashboard and range are in the path (ADR 0064) and switching dashboard keeps the range. The header lives in the layout, so a change reloads only the content: it stays on screen, dimmed, until the next is ready, then the figures count from their last values and the lines draw in. `/data`, `/data/{dashboard}`, the old `/dashboard/...` and `/financials/...` redirect to a dashboard on this month. Financials needs `finance:read`; without it only Workload shows.

## Range
- Presets: last 7 days, last 30 days, this month (the default), last 3 months, last 12 months, next 28 days, or two picked days; at most 24 months. No previous or next buttons.
- **Buckets** of a trend line: days up to 31 days, weeks (from the range's first day) up to 6 months, calendar months beyond.
- **Trend**: every stat card compares with the previous range of equal length. A sum compares sums; a snapshot compares its value at the range's end (capped at now) with its value at the range's start. No previous value, or a previous value of 0, shows no percentage. Green or red follows the figure's polarity.

## Financials tab (`finance.overview`)
| Part | Source | Needs |
| --- | --- | --- |
| Stat cards: invoiced and received (sums), outstanding and overdue (snapshots) | `trends` | `payment:read` |
| Invoiced and received per month; won and lost per month | `monthly`, `outcomes` | `payment:read`, `quote:read` |
| Invoiced per type; open invoices by age (today) | `revenueByType`, `aging` | `payment:read` |
| VAT per rate, the most overdue invoices, the SIE exports (tables) | `vatByRate`, `aging.overdue`, `accountingExport.list` | `payment:read`, `finance:read` |

Polarity: invoiced and received up is good; outstanding and overdue down is good. Outstanding at an instant = what was open then on invoices sent by then (payments by `paidAt`, refunds by `refundedAt`); overdue = the same, a whole day past the due date.

## Workload tab (`dashboard.summary`)
| Part | Source | Needs | Covers |
| --- | --- | --- | --- |
| Stat card per open status: open tickets now, their value, the count's line | `statuses` | `ticket:read` | now, line over the range |
| Needs attention: holds expiring within 7 days, unsent sheets for tickets in the next 28 days, overdue invoices | `attention` | `ticket:read`, `sheet:read`, `finance:read` and `payment:read` | now |
| Scheduled: tickets with lines starting in the range | `scheduled` | `ticket:read` | range |
| Utilisation per bookable item type | `utilisation` | `item:read` | range |
| Booked, not yet invoiced: accepted quotes per event month | `bookedAhead` | `quote:read` | months in the range |

A status's open tickets at an instant are replayed from `TicketStatusChange` (ADR 0054) for the tickets active today; more open tickets is neither good nor bad, so its trend is neutral.

## Definitions
- **Open status**: `closes = false`, in position order, grouped by id (ADR 0021). **Value**: estimated and confirmed excl. VAT as on the board (ADR 0074).
- **Expiring hold**, **unsent sheet**, **overdue**, **utilisation** and **booked ahead**: as in ADR 0080 and 0079.

## Layout
- Stat cards first, then rows of cards of one kind: charts with charts, tables full width. A table in a card runs edge to edge under the padded heading.
- Everything is derived on read; nothing is stored (ADR 0051).
