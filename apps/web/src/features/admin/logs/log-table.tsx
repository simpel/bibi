"use client";

import type { SystemLogEntry, SystemLogListQuery } from "@bibi/core/schemas";
import { cn, type SortingState } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useDataTablePaginationLabels } from "@/lib/use-data-table-pagination-labels";
import { LOG_PAGE_SIZES } from "./log-params";
import { useLogColumns } from "./use-log-columns";
import { useLogNavigation } from "./use-log-navigation";

export type LogTableProps = {
  items: SystemLogEntry[];
  total: number;
  pageCount: number;
  view: Pick<SystemLogListQuery, "page" | "pageSize" | "sort" | "direction">;
  selectedId: string | null;
};

/** The URL patch for a new sort: none clears it back to the newest first. */
const sortPatch = ({ sorting }: { sorting: SortingState }) => {
  const [next] = sorting;
  return next ? { sort: next.id, dir: next.desc ? "desc" : "asc" } : { sort: null, dir: null };
};

/** Server-paginated log table; the URL holds page, size, sorting and the selected row (`?log=`). */
export function LogTable({ items, total, pageCount, view, selectedId }: LogTableProps) {
  const t = useTranslations("admin.logs");
  const columns = useLogColumns();
  const labels = useDataTablePaginationLabels({
    total: (count) => t("pagination.total", { count }),
  });
  const { navigate, pending } = useLogNavigation();
  return (
    <PersistedDataTable
      tableId="admin.logs"
      className={cn(pending && "opacity-60 transition-opacity")}
      columns={columns}
      data={items}
      getRowId={(entry) => entry.id}
      emptyText={t("empty")}
      pagination={{
        pageIndex: view.page - 1,
        pageSize: view.pageSize,
        pageCount,
        totalCount: total,
        pageSizeOptions: LOG_PAGE_SIZES,
        labels,
        onPaginationChange: ({ pageIndex, pageSize: size }) =>
          navigate({ patch: { page: String(pageIndex + 1), pageSize: String(size) } }),
      }}
      manualSorting
      sorting={[{ id: view.sort, desc: view.direction === "desc" }]}
      onSortingChange={(sorting) => navigate({ patch: sortPatch({ sorting }) })}
      onRowClick={(entry) => navigate({ patch: { log: entry.id } })}
      {...(selectedId ? { selectedRowId: selectedId } : {})}
    />
  );
}
