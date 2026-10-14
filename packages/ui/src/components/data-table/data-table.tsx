"use client";

import { type ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { cn } from "../../lib/cn";
import { Table } from "../table/table";
import { DataTableBody } from "./data-table-body";
import { DataTableHeader } from "./data-table-header";
import { DataTablePagination } from "./data-table-pagination";
import type { DataTableLabels, DataTablePaginationState } from "./data-table-types";

const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100];

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
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Omit to render all rows without a footer. */
  pagination?: DataTableServerPagination;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
  selectedRowId?: string;
  emptyText: string;
  className?: string;
};

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  const { pagination } = props;
  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    getRowId: props.getRowId,
    ...(pagination
      ? {
          pageCount: pagination.pageCount,
          state: { pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize } },
          manualPagination: true,
        }
      : {}),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div data-slot="data-table" className={cn("flex flex-col", props.className)}>
      <div className="rounded-md border">
        <Table>
          <DataTableHeader groups={table.getHeaderGroups()} />
          <DataTableBody
            rows={table.getRowModel().rows}
            columnCount={props.columns.length}
            emptyText={props.emptyText}
            onRowClick={props.onRowClick}
            selectedRowId={props.selectedRowId}
          />
        </Table>
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
