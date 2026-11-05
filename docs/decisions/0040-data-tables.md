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
- **Column order, left to right (enforced by `createTableColumns({ select, primary, relations, status, dates, numbers, actions })` in `@bibi/ui`):**
  1. `select`: Optional multiselect checkbox (`selectable`, pinned left; enabled wherever batch operations exist).
  2. `primary`: Main title, name or identifier (semi-bold, accessible `<Link>`).
  3. `relations`: Descriptive columns & relations in the organization's own order (type, customer, venue, category, assignee, channel).
  4. `status`: Operational status or state (`statusColumn` or `<StatusBadge label={...} color={...} />` from `@bibi/ui`, which renders `<Badge variant="secondary" className="gap-1.5"><ColorSwatch color={...} />{label}</Badge>`; never a lone dot without text, never a competing outline or solid badge variant, and always positioned before dates/times and numbers).
  5. `dates`: Dates and times (`dateColumn`; when, receivedAt, publishedAt, createdAt; always left-aligned under the column header).
  6. `numbers`: Numbers and amounts (`numberColumn`; quantities, headcount, monetary values).
  7. `actions`: Row actions (`actionsColumn`, pinned right).
- **Search and filters:** every listing page provides search and filtering via `QuerySearch` (`components/query-search/`) or `ClientDataTable` / `TableFilterBar` (`components/data-table/`), supporting both free text and qualifier autocomplete suggestions (`key:value`, e.g. `status:Lead`, `assignee:me`, `type:...`, `role:...`, `channel:...`, `city:...`). Quick filter tabs/pills sit to the left of `QuerySearch`. Filter state is synchronized to the URL (`?q=...`).
- **Row click & navigation:** clicking a row (`onRowClick`) navigates to the record's primary detail page (or opens its slide-over sheet for activity tables like the inbox). The title cell retains a `<Link>` for keyboard and Cmd/Ctrl+Click new tab access. Embedded interactive controls (checkboxes, sub-entity links, action buttons) stop event propagation.
- **Row actions & context menu:** row actions sit in the last column (`actionsColumn`), sticky to the right edge. Handled by `DataTableRowActions` (primary button on wide screens, folding into an overflow menu below `@2xl`). The same actions must be mirrored in the right-click menu (`rowMenu` on `PersistedDataTable`).
- **Multiselect & bulk actions:** enabled (`selectable={true}`) whenever batch actions exist. Selected rows trigger `DataTableToolbar` above the table showing the selection count and `bulkActions` buttons. Page changes clear the selection.
- **Pagination & sorting:** lists use `PersistedDataTable`'s integrated `DataTablePagination` with standard page sizes (`[25, 50, 100]`), page counts, and server-side sorting (`manualSorting` syncing `sort` and `dir` to the URL). Do not render external pagination below tables.
- **Row actions** sit in the last column, sticky to the right edge of the visible area. One or two clear actions are direct buttons (`DataTableRowAction`), more go in a menu (`DataTableRowActions`) with text items. Narrow tables show the icons only, wide ones icon and label (container query); an unmistakable icon may stay icon-only at every width, with its label as tooltip and accessible name. Amended 2026-11-02: icon-only row actions were first ruled out, but they hid the actions on small screens. Amended 2026-11-03: one component (`DataTableRowActions`) carries every row's actions, primary buttons plus a menu; below `@2xl` the buttons fold into the menu, except a lone action, which stays an icon button. Two components for the same column had drifted apart. Amended 2026-11-03: a row can be styled from its data (`rowClassName`). Activity tables (notifications, the inbox) follow an inbox look: unread rows white with a dot, read rows grey, a small context line over the title, and on hover a quick action in place of the time. Read and unread stay in one table, so marking a row never moves it.
- **Drag and drop:** users reorder columns by dragging. It is always on. The checkbox and row actions are pinned to the edges, every other column can move.
- **Saved per user and per table:** the order is stored as a user preference (ADR 0039) under `table.columns.<tableId>`, on the server, so it follows the user across devices. The `(app)` and `(admin)` layouts load all of a user's table orders once; `PersistedDataTable` restores and saves them. A saved order that no longer matches the columns (a column was added or removed) is repaired by `resolveColumnOrder`.
- **Column definitions:** build columns with `createTableColumns`, `statusColumn`, `dateColumn`, `numberColumn`, and `actionsColumn` from `@bibi/ui` so badge styling and zone ordering cannot drift. Extract a `use-<entity>-columns` hook only when columns are shared between a page table and an assistant card; otherwise define them directly in the table component.
- **Exception:** the calendar grid is a keyboard-navigated time grid, not a table of records.

## Consequences
- A new list is a `PersistedDataTable` with a stable `tableId` and a columns hook. Nothing else renders rows and columns.
- Saving a column order goes through the normal toast flow, like any auto-save.
- Server-paginated tables sort the loaded page only until their operation supports sorting.
- A `tableId` that is renamed loses the users' saved order for that table.
