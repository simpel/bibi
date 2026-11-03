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
  /**
   * The row's actions again as a right-click menu: `ContextMenuItem`s, each with a text label.
   * The actions column stays; this is the shortcut, never the only way.
   */
  rowMenu?: (row: TData) => ReactNode;
  getRowId?: (row: TData) => string;
  /**
   * Extra classes for a row from its data, e.g. a muted background for read items. Rows are a
   * `group/row`, so cells can show things on hover with `group-hover/row:`.
   */
  rowClassName?: (row: TData) => string | undefined;
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
  /**
   * Inside a card: edge to edge with no frame of its own, only a rule above it, so there is no
   * box in a box. The card's heading keeps its padding (ADR 0086).
   */
  flush?: boolean;
  className?: string;
};
