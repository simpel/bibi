"use client";

import { DataTable, type DataTableProps } from "@okazi/ui";
import { useDataTableTextLabels } from "@/lib/use-data-table-text-labels";
import { useColumnOrder } from "./use-column-order";

export type PersistedDataTableProps<TData, TValue> = Omit<
  DataTableProps<TData, TValue>,
  "textLabels" | "columnOrder" | "onColumnOrderChange"
> & {
  /** Stable id; the saved column order is stored under it. Lowercase letters, digits, `.`, `-`. */
  tableId: string;
};

/**
 * The only way a table is rendered in the web app: the shared `DataTable` with texts from i18n and
 * the user's column order restored and saved per table (ADR 0040).
 */
export function PersistedDataTable<TData, TValue>({
  tableId,
  ...props
}: PersistedDataTableProps<TData, TValue>) {
  const textLabels = useDataTableTextLabels();
  const { order, save } = useColumnOrder({ tableId });
  return (
    <DataTable
      {...props}
      textLabels={textLabels}
      {...(order ? { columnOrder: order } : {})}
      onColumnOrderChange={(order) => save({ order })}
    />
  );
}
