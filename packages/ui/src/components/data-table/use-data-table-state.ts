import type { RowSelectionState, SortingState, Table, Updater } from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";
import { resolveColumnOrder } from "./data-table-order";

export function applyUpdater<T>({ updater, current }: { updater: Updater<T>; current: T }): T {
  return typeof updater === "function" ? (updater as (old: T) => T)(current) : updater;
}

export type SortingStateInput = {
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
};

/** Sorting state: controlled when `sorting` is given, internal otherwise. */
export function useSortingState({ sorting, onSortingChange }: SortingStateInput) {
  const [internal, setInternal] = useState<SortingState>([]);
  const current = sorting ?? internal;
  return {
    sorting: current,
    onSortingChange: (updater: Updater<SortingState>) => {
      const next = applyUpdater({ updater, current });
      setInternal(next);
      onSortingChange?.(next);
    },
  };
}

export type ColumnOrderStateInput = {
  columnIds: string[];
  columnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;
};

/** Column order: resolved against the current columns, controlled or internal. */
export function useColumnOrderState({
  columnIds,
  columnOrder,
  onColumnOrderChange,
}: ColumnOrderStateInput) {
  const [internal, setInternal] = useState<string[]>();
  const order = resolveColumnOrder({ saved: columnOrder ?? internal, columnIds });
  return {
    order,
    setOrder: (next: string[]) => {
      setInternal(next);
      onColumnOrderChange?.(next);
    },
  };
}

/** Row selection, cleared when the page changes (rows are per page). */
export function useRowSelectionState({ resetKey }: { resetKey: string }) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  // biome-ignore lint/correctness/useExhaustiveDependencies: resetKey is the trigger
  useEffect(() => setRowSelection({}), [resetKey]);
  return { rowSelection, setRowSelection };
}

export type SelectionNotifyInput<TData> = {
  table: Table<TData>;
  rowSelection: RowSelectionState;
  onSelectionChange?: (rows: TData[]) => void;
};

/** Reports the selected rows whenever the selection changes. */
export function useSelectionNotify<TData>({
  table,
  rowSelection,
  onSelectionChange,
}: SelectionNotifyInput<TData>) {
  const callback = useRef(onSelectionChange);
  callback.current = onSelectionChange;
  // biome-ignore lint/correctness/useExhaustiveDependencies: rowSelection is the trigger
  useEffect(() => {
    callback.current?.(table.getSelectedRowModel().rows.map((row) => row.original));
  }, [rowSelection, table]);
}
