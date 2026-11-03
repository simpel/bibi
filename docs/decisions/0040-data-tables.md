# 0040 – Data tables

- **Date:** 2026-10-17
- **Status:** Accepted
- **Related:** 0039 (user preferences), 0003 (parity architecture)

## Context
- Tables were written by hand with the `Table*` primitives in about 45 places (feature lists and the assistant's cards). Each had its own column order, no sorting and its own row actions.
- Staff scan the same lists every day and want them the way they set them up.

## Decision
Every table is a shadcn TanStack table: the `DataTable` in `@bibi/ui`, rendered in the web app through `PersistedDataTable`. Never a raw `<table>`, never another table library.

- **Sorting:** every data column is sortable (ascending, descending, none). A column sorts by the value the user sees (`accessorFn`).
- **Column order, left to right:** optional multiselect checkbox (only where bulk editing helps; no bulk operation exists yet, so it is off everywhere), the main title, name or identifier, descriptive columns in the organization's own order, status, dates and times, numbers and amounts, row actions.
- **Row actions** sit in the last column, sticky to the right edge of the visible area. One or two clear actions are direct buttons (`DataTableRowAction`), more go in a menu (`DataTableRowActions`) with text items. Narrow tables show the icons only, wide ones icon and label (container query); an unmistakable icon may stay icon-only at every width, with its label as tooltip and accessible name. Amended 2026-11-02: icon-only row actions were first ruled out, but they hid the actions on small screens. Amended 2026-11-03: one component (`DataTableRowActions`) carries every row's actions, primary buttons plus a menu; below `@2xl` the buttons fold into the menu, except a lone action, which stays an icon button. Two components for the same column had drifted apart.
- **Drag and drop:** users reorder columns by dragging. It is always on. The checkbox and row actions are pinned to the edges, every other column can move.
- **Saved per user and per table:** the order is stored as a user preference (ADR 0039) under `table.columns.<tableId>`, on the server, so it follows the user across devices. The `(app)` and `(admin)` layouts load all of a user's table orders once; `PersistedDataTable` restores and saves them. A saved order that no longer matches the columns (a column was added or removed) is repaired by `resolveColumnOrder`.
- **One definition per table:** columns live in a `use-<entity>-columns` hook. The assistant's card has its own small hook and its own `tableId` (`<entity>.assistant`), because its data has a different shape (dates as strings, no lookups) and fewer columns; it reuses the same cells and has no row actions.
- **Exception:** the calendar grid is a keyboard-navigated time grid, not a table of records.

## Consequences
- A new list is a `PersistedDataTable` with a stable `tableId` and a columns hook. Nothing else renders rows and columns.
- Saving a column order goes through the normal toast flow, like any auto-save.
- Server-paginated tables sort the loaded page only until their operation supports sorting.
- A `tableId` that is renamed loses the users' saved order for that table.
