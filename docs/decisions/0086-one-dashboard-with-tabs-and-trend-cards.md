# 0086 – One dashboard with Financials and Workload tabs

- **Date:** 2026-11-01
- **Status:** Accepted
- **Related:** 0080 (supersedes its page split), 0079, 0077, 0064, 0036, 0071, 0051

## Context
- ADR 0080 split two pages by time direction. In use they still looked and behaved differently, with different stat boxes and period controls.
- The user wants one place to read the business: one header, one date range, and the two views as tabs.

## Decision
1. One page with two dashboards, Financials and Workload, with the period in the path (ADR 0064). Old URLs redirect. The Financials menu entry goes (amends ADR 0036). A dashboard the caller may not read is not shown.
2. One range picker with presets that look back and ahead. No prev and next buttons.
3. The range drives both dashboards. Pipeline tiles, "Needs attention", outstanding, overdue and aging stay "now", each with a trend over the range. This replaces ADR 0080's fixed 28-day window; its ownership moves stand.
4. Every headline figure is one `StatCard` in `@bibi/ui`, showing a trend and the change against the previous range of equal length.
5. Trend series are derived on read (ADR 0051), never stored. Snapshots are rebuilt from invoices, payments, refunds and status history.
6. Operations stay per owner. `finance.overview` and `dashboard.summary` both take `{ from, to }` and return their figures with a series and previous values, each with its own gates (ADR 0071).

## Rejected
- Keep two pages with the same picker. One header with tabs reads as one place.
- Store daily snapshots for trends. A second copy of facts that invoices, payments and status history hold.
- Trend from the first to the last bucket. The previous equal range is the comparison people expect.

## Consequences
- `dashboard.summary` takes a period again. Both outputs change, a breaking change on GraphQL, REST and MCP and for the assistant's cards.
- The demo seed history must reach the previous month so every card shows a trend.
- Later addendum: the menu entry and URLs are called Data, with a dashboard switcher in a shared layout so a range change reloads only the content below.
- Candidate to merge into `docs/specs/dashboard.md`.
