import { cn } from "../../lib/cn";
import { DataTableNav } from "./data-table-nav";
import { DataTablePageSize } from "./data-table-page-size";
import type { DataTableLabels, DataTablePaginationState } from "./data-table-types";

export type DataTablePaginationProps = {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalCount: number;
  pageSizeOptions: number[];
  labels: DataTableLabels;
  onPaginationChange: (state: DataTablePaginationState) => void;
  className?: string;
};

export function DataTablePagination(props: DataTablePaginationProps) {
  const { pageIndex, pageSize, pageCount, labels, onPaginationChange } = props;
  return (
    <div
      data-slot="data-table-pagination"
      className={cn("flex flex-wrap items-center justify-between gap-4 px-2 py-3", props.className)}
    >
      <span className="font-sans text-sm tabular-nums text-muted-foreground">
        {labels.total(props.totalCount)}
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <DataTablePageSize
          pageSize={pageSize}
          pageSizeOptions={props.pageSizeOptions}
          label={labels.rowsPerPage}
          onChange={(next) => onPaginationChange({ pageIndex: 0, pageSize: next })}
        />
        <span className="font-sans text-sm tabular-nums">
          {labels.pageOf(pageIndex + 1, Math.max(pageCount, 1))}
        </span>
        <DataTableNav
          pageIndex={pageIndex}
          pageCount={pageCount}
          labels={labels}
          onGoTo={(next) => onPaginationChange({ pageIndex: next, pageSize })}
        />
      </div>
    </div>
  );
}
