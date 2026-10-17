import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { ReactNode } from "react";
import type {
  DataTableLabels,
  DataTablePaginationState,
  DataTableTextLabels,
} from "./data-table-types";

export type DataTableServerPagination = {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalCount: number;
  onPaginationChange: (state: DataTablePaginationState) => void;
  pageSizeOptions?: number[];
  labels: DataTableLabels;
};

export type DataTableProps<TData, TValue> = {
  /**
   * Columns in default order: title, descriptive columns, status, dates, numbers. Add the row
   * actions last with `actionsColumn`. Use string `header`s (they label the drag handle). Every
   * column with an accessor is sortable; to sort by a display value give it an `accessorFn`.
   */
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Omit to render all rows without a footer. */
  pagination?: DataTableServerPagination;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
  selectedRowId?: string;
  emptyText: string;
  /** Sorting, column order and selection texts. */
  textLabels: DataTableTextLabels;
  /** Controlled sorting. Omit for internal state. */
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /** Set when the server sorts (required with server pagination, else only the page is sorted). */
  manualSorting?: boolean;
  /** Controlled column order (ids, pinned included). Omit for internal state. Always draggable. */
  columnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;
  /** Adds the pinned checkbox column. Selection is cleared when the page changes. */
  selectable?: boolean;
  onSelectionChange?: (rows: TData[]) => void;
  /** Rendered in a toolbar above the table while at least one row is selected. */
  bulkActions?: (rows: TData[]) => ReactNode;
  className?: string;
};
