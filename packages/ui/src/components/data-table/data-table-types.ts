export type DataTablePaginationState = { pageIndex: number; pageSize: number };

/** Pagination footer texts. */
export type DataTableLabels = {
  rowsPerPage: string;
  pageOf: (page: number, pageCount: number) => string;
  first: string;
  previous: string;
  next: string;
  last: string;
  total: (count: number) => string;
};

/** Texts for sorting, column reordering and selection. `@bibi/ui` has no i18n, so apps pass them. */
export type DataTableTextLabels = {
  sortAscending: string;
  sortDescending: string;
  clearSort: string;
  /** Accessible name of a column's drag handle. */
  dragColumn: (column: string) => string;
  /** Screen reader instructions read when a drag handle gets focus. */
  dragInstructions: string;
  columnPickedUp: (column: string) => string;
  columnMoved: (column: string, position: number, total: number) => string;
  columnDropped: (column: string, position: number, total: number) => string;
  selectAll: string;
  selectRow: string;
  selected: (count: number) => string;
};
