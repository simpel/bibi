import type { RowData } from "@tanstack/react-table";
import type { ReactNode } from "react";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Explains the column in a hover card behind a help icon in its header. */
    help?: ReactNode;
    /** Where the header sits: right for amounts (`numberColumn`). */
    align?: "left" | "right";
  }
}

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
  /** Accessible name of a column's help icon. */
  columnHelp: (column: string) => string;
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
