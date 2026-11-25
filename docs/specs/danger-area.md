# Danger area

Target behaviour. Archive is built; delete, restore and retention follow ADR 0118 (accepted, being built).

## Rule
- Every record with its own page has one danger area: the last section of the page, or the last tab when the page has tabs. It is the only place to archive or delete that record: no Archive or Delete in header actions, ⋯ menus, row actions or context menus of its list.
- Rows without a page of their own (contacts, comments, lines, list values, fields, demands, statuses) keep their row action.
- It looks the same everywhere: `DangerZone` with one `DangerZoneRow` per action (`@bibi/ui`), titled "Danger area" (`common.dangerArea`). Each row says what happens and opens a `ConfirmDialog`.
- It shows only with the record's `<feature>:delete`.

## Actions
- An active record: **Archive** (built).
- An archived record (ADR 0118, not built): **Restore**, and **Delete permanently**, confirmed by typing the record's name. Archived records are deleted after the organization's retention period (default 90 days, at most 180), except money records and orders with any.

## Rollout
- Built: tasks.
- To move: customer, item, venue, package, price list, type, list, responsibility, run sheet template, skill, status, item type group, order.
