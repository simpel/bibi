import {
  type ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { columnIdOf, columnTitles } from "./data-table-columns";
import type { DataTableProps } from "./data-table-props";
import { selectColumn } from "./data-table-select-column";
import { compareRows } from "./data-table-sorting";
import {
  useColumnOrderState,
  useRowSelectionState,
  useSelectionNotify,
  useSortingState,
} from "./use-data-table-state";

/** Builds the TanStack table with sorting, column order, selection and server pagination. */
export function useDataTable<TData, TValue>({ props }: { props: DataTableProps<TData, TValue> }) {
  const { pagination, selectable, textLabels } = props;
  const columns = useMemo(() => {
    const base = props.columns as ColumnDef<TData, unknown>[];
    return selectable ? [selectColumn<TData>({ labels: textLabels }), ...base] : base;
  }, [props.columns, selectable, textLabels]);
  const sorting = useSortingState(props);
  const { order, setOrder } = useColumnOrderState({
    ...props,
    columnIds: columns.map((column) => columnIdOf({ column })),
  });
  const { rowSelection, setRowSelection } = useRowSelectionState({
    resetKey: `${pagination?.pageIndex}:${pagination?.pageSize}`,
  });
  const table = useReactTable({
    data: props.data,
    columns,
    getRowId: props.getRowId,
    state: {
      ...sorting,
      columnOrder: order,
      rowSelection,
      ...(pagination
        ? { pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize } }
        : {}),
    },
    ...(pagination ? { pageCount: pagination.pageCount, manualPagination: true } : {}),
    manualSorting: props.manualSorting ?? false,
    enableMultiSort: false,
    enableRowSelection: selectable ?? false,
    onRowSelectionChange: (updater) =>
      setRowSelection(typeof updater === "function" ? updater(rowSelection) : updater),
    defaultColumn: { sortingFn: (rowA, rowB, columnId) => compareRows({ rowA, rowB, columnId }) },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  useSelectionNotify({ table, rowSelection, onSelectionChange: props.onSelectionChange });
  return { table, order, setOrder, titles: columnTitles({ columns }) };
}
