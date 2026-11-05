# 0086 – One dashboard with Financials and Workload tabs, and trend stat cards

- **Date:** 2026-11-01
- **Status:** Accepted (approved by the user on 2026-11-01)
- **Related:** 0080 (dashboard ahead, Financials behind; supersedes its page split), 0079 (dashboard summary), 0077 (financials), 0064 (time, period in the path), 0036 (sidebar), 0071 (view read models), 0051 (derived values)

## Context
- ADR 0080 split the two pages by time direction. In use, the pages still look and behave differently: two kinds of stat boxes, charts and tables on one row, and different period controls (the dashboard has none, Financials has prev and next buttons).
- The user wants one place to read the business: one header with one date range, and the two views as tabs. Every headline figure should be the same card, showing how it moved over the chosen range.

## Decision
1. **One page, two tabs.** `/dashboard/{tab}/{from}/{to}`, `tab` = `financials` or `workload` (period in the path, ADR 0064). A header (title, preamble and the range picker) sits on the page background; under it a white section holds the tabs. `/financials/...` and `/dashboard` redirect there. The Financials menu entry goes (amends ADR 0036). A tab the caller may not read is not shown (Financials needs `finance:read`).
2. **One range picker, no prev and next.** `PeriodRangeButton` with presets that look back and ahead: last 7 days, last 30 days, this month, last 3 months, last 12 months, next 28 days. Default: this month. The prev and next buttons are removed from every page.
3. **What the range drives.**
   - Financials: everything it shows today, for the range (invoiced, received, won and lost, revenue per type, VAT). Outstanding, overdue and aging stay "today", each with a trend over the range (point 5).
   - Workload: utilisation and the orders with lines in the range (was "coming up"), booked ahead by event month inside the range. The pipeline tiles and "Needs attention" stay "now", each tile with a trend over the range.
   - This replaces ADR 0080's fixed 28-day window; the ahead/behind split becomes the two tabs.
4. **Stat cards.** Every headline figure is one `StatCard` in `@bibi/ui`: label, value, a background trend line with a gradient below it (no axes or numbers), a minimal tooltip with the bucket's date and value on hover, and the trend at the bottom right: an up or down icon and the percentage against the previous range of equal length. Green or red follows the figure's polarity: up is good for received, bad for overdue. No change or no previous data shows no percentage.
5. **Trend series are derived on read** (ADR 0051), never stored. Buckets: days up to 31 days, weeks up to 6 months, months beyond. A sum (invoiced, received, won) is the sum per bucket. A snapshot is rebuilt at each bucket's end: open and overdue money from invoices (`sentAt`, `dueDate`) minus payments (`paidAt`) and refunds (`refundedAt`); open orders per status from `OrderStatusChange`. Each operation returns its figures with `series` and `previous` beside them.
6. **Operations stay per owner.** `finance.overview({ from, to })` answers the Financials tab and `dashboard.summary({ from, to })` the Workload tab; both gain series and previous values. Each keeps its own permission and view gates (ADR 0071).

## Consequences
- `dashboard.summary` takes `{ from, to }` again and both outputs change: breaking on GraphQL, REST and MCP, and the assistant's cards.
- A UI rule (web `CLAUDE.md`), not part of this decision: a table inside a card runs edge to edge; the card's heading and text keep their padding. No box in a box.
- Charts and tables never share a row; a row holds cards of one kind.
- Demo seed: the default range (this month) must show a trend on every card, so the seeded history must reach the previous month.
- Addendum on ADR 0080 (its page split and fixed window are superseded; the ownership moves in its point 5 stay).

## Alternatives rejected
- **Keep two pages and give both the same picker.** Rejected by the user: one header and tabs reads as one place.
- **Store daily snapshots for trends.** Rejected: a second copy of facts the invoices, payments and status history already hold (ADR 0051). Revisit only if deriving is too slow.
- **Trend from the first to the last bucket in the range.** Rejected: the previous equal range is the comparison people expect from a percentage.

## Addendum 2026-11-01 – Dashboards, header in a layout
- The page's heading is **Dashboards** and each tab is a dashboard. The menu entry and the URLs are called **Data**: `/data/{dashboard}/{from}/{to}`, `dashboard` = `financials` or `workload`. `/dashboard/...` redirects to the same dashboard and range.
- The dashboards are switched with a prominent switcher in the header (not plain tabs), which sits with the title, preamble and range picker. The header lives in the `/data` layout and reads the dashboard and range from the URL, so a tab or range change reloads only the content below it. The change is a transition: the current content stays on screen, dimmed, until the next is ready; the stat figures then count from their last values and the lines draw in.

