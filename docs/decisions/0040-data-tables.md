# 0040 – Data tables

- **Date:** 2026-10-17
- **Status:** Accepted
- **Related:** 0039 (user preferences), 0003 (parity architecture)

## Context
- Tables were hand-written with the table primitives in about 45 places. Each had its own column order, no sorting and its own row actions.
- Staff scan the same lists every day and want them set up their own way.

## Decision
1. Every table is the shared `DataTable` from `@bibi/ui`, rendered through `PersistedDataTable`. Never a raw table or another table library.
2. Columns follow a fixed zone order: select, primary, relations, status, dates, numbers, actions. A shared builder enforces it so badge styling and order cannot drift.
3. Every data column sorts by the value the user sees. Search and filters are URL-synced on every listing page.
4. Row click opens the record, row actions sit in the last column with a mirrored context menu, and bulk actions appear whenever batch operations exist.
5. Users reorder columns by dragging. The order is saved per user and table as a user preference (ADR 0039), so it follows them across devices.
6. The calendar grid is an exception: it is a time grid, not a table of records.

## Rejected
- Hand-written tables per feature: they drifted apart.
- Two components for row actions: they drifted and were merged into one.

## Consequences
- A new list is a `PersistedDataTable` with a stable `tableId` and a columns hook.
- Renaming a `tableId` loses users' saved order for that table.
- Server-paginated tables sort only the loaded page until their operation supports sorting.
