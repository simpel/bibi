"use client";

import { cn } from "../../lib/cn";
import { Table } from "../table/table";
import { DataTableBody } from "./data-table-body";
import { DataTableDnd } from "./data-table-dnd";
import { DataTableHeader } from "./data-table-header";
import { DataTablePagination } from "./data-table-pagination";
import type { DataTableProps } from "./data-table-props";
import { DataTableToolbar } from "./data-table-toolbar";
import { useDataTable } from "./use-data-table";

const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100];

export type { DataTableProps, DataTableServerPagination } from "./data-table-props";

/**
 * The one table of the app: TanStack with sorting on every column, drag-and-drop column order
 * (always on), optional multiselect with bulk actions and server pagination.
 */
export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  const { pagination, textLabels } = props;
  const { table, order, setOrder, titles } = useDataTable({ props });
  const selected = table.getSelectedRowModel().rows.map((row) => row.original);
  return (
    <div data-slot="data-table" className={cn("flex flex-col", props.className)}>
      {props.bulkActions && selected.length > 0 ? (
        <DataTableToolbar selectedLabel={textLabels.selected(selected.length)}>
          {props.bulkActions(selected)}
        </DataTableToolbar>
      ) : null}
      <div className="rounded-md border">
        <DataTableDnd order={order} titles={titles} labels={textLabels} onOrderChange={setOrder}>
          <Table>
            <DataTableHeader groups={table.getHeaderGroups()} titles={titles} labels={textLabels} />
            <DataTableBody
              rows={table.getRowModel().rows}
              columnCount={table.getVisibleLeafColumns().length}
              emptyText={props.emptyText}
              onRowClick={props.onRowClick}
              selectedRowId={props.selectedRowId}
            />
          </Table>
        </DataTableDnd>
      </div>
      {pagination ? (
        <DataTablePagination
          {...pagination}
          pageSizeOptions={pagination.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS}
        />
      ) : null}
    </div>
  );
}
