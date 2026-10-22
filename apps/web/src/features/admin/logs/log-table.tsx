"use client";

import type { SystemLogEntry } from "@bibi/core/schemas";
import { cn, type DataTableLabels } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useLogColumns } from "./use-log-columns";
import { useLogNavigation } from "./use-log-navigation";

export type LogTableProps = {
  items: SystemLogEntry[];
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  selectedId: string | null;
};

function usePaginationLabels(): DataTableLabels {
  const t = useTranslations("admin.logs.pagination");
  return {
    rowsPerPage: t("rowsPerPage"),
    pageOf: (page, pageCount) => t("pageOf", { page, pageCount }),
    first: t("first"),
    previous: t("previous"),
    next: t("next"),
    last: t("last"),
    total: (count) => t("total", { count }),
  };
}

/** Server-paginated log table; the URL holds page, size and the selected row (`?log=`). */
export function LogTable({ items, page, pageSize, pageCount, total, selectedId }: LogTableProps) {
  const t = useTranslations("admin.logs");
  const columns = useLogColumns();
  const labels = usePaginationLabels();
  const { navigate, pending } = useLogNavigation();
  return (
    <PersistedDataTable
      tableId="admin.logs"
      className={cn(pending && "opacity-60 transition-opacity")}
      columns={columns}
      data={items}
      pagination={{
        pageIndex: page - 1,
        pageSize,
        pageCount,
        totalCount: total,
        onPaginationChange: ({ pageIndex, pageSize: size }) =>
          navigate({ patch: { page: String(pageIndex + 1), pageSize: String(size) } }),
        labels,
      }}
      onRowClick={(entry) => navigate({ patch: { log: entry.id } })}
      getRowId={(entry) => entry.id}
      {...(selectedId ? { selectedRowId: selectedId } : {})}
      emptyText={t("empty")}
    />
  );
}
