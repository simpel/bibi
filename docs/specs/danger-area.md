# Danger area

Target behaviour. Archive is built; delete, restore and retention follow ADR 0118 (accepted, being built).

## Rule
- Every record with its own page has one danger area: the last section of the page, or the last tab when the page has tabs. It is the only place to archive or delete that record: no Archive or Delete in header actions, ⋯ menus, row actions or context menus of its list.
- Rows without a page of their own (contacts, comments, lines, list values, fields, demands, item type groups) keep their row action.
- It looks the same everywhere: `DangerZone` with one `DangerZoneRow` per action (`@bibi/ui`), titled "Danger area" (`common.dangerArea`). Each row says what happens and opens a `ConfirmDialog`.
- It shows only with the record's `<feature>:delete`.

## Actions
- An active record: **Archive** (built).
- An archived record (ADR 0118, not built): **Restore**, and **Delete permanently**, confirmed by typing the record's name. Archived records are deleted after the organization's retention period (default 90 days, at most 180), except money records and orders with any.

## Rollout
- Built: task, customer, venue, type, list, skill (sections); item, package (last tab); price list, responsibility, run sheet template, status, item state (last on the edit page, their only page). A status is no longer archived from a board's chip menu.
- Not moved: item type groups have no page of their own (edited in a dialog on Types), so they keep their row action. Orders have no archive in the app.
