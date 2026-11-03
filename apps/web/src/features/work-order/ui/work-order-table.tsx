"use client";

import { cn, type SortingState } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useDataTablePaginationLabels } from "@/lib/use-data-table-pagination-labels";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import { WORK_ORDER_PAGE_SIZES, type WorkOrderListParams } from "../lib/list-params";
import type { WorkOrderRow } from "../lib/work-order-rows";
import { useWorkOrderColumns } from "./use-work-order-columns";

export type WorkOrderTableProps = {
  rows: WorkOrderRow[];
  total: number;
  view: Pick<WorkOrderListParams, "page" | "pageSize" | "sort" | "direction">;
};

type Navigate = ReturnType<typeof useQueryNavigation>["navigate"];

/** The URL patch for a new sort: none clears it back to the newest first. */
const sortPatch = ({ sorting }: { sorting: SortingState }) => {
  const [next] = sorting;
  return next ? { sort: next.id, dir: next.desc ? "desc" : "asc" } : { sort: null, dir: null };
};

function usePagination({
  total,
  view,
  navigate,
}: Pick<WorkOrderTableProps, "total" | "view"> & { navigate: Navigate }) {
  const t = useTranslations("workOrder.list");
  const labels = useDataTablePaginationLabels({ total: (count) => t("total", { count }) });
  return {
    pageIndex: view.page - 1,
    pageSize: view.pageSize,
    pageCount: Math.ceil(total / view.pageSize),
    totalCount: total,
    pageSizeOptions: WORK_ORDER_PAGE_SIZES,
    labels,
    onPaginationChange: ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) =>
      navigate({ patch: { page: String(pageIndex + 1), pageSize: String(pageSize) } }),
  };
}

/** Work order versions, paged, sorted and searched on the server: the URL holds the state. */
export function WorkOrderTable({ rows, total, view }: WorkOrderTableProps) {
  const t = useTranslations("workOrder.list");
  const columns = useWorkOrderColumns();
  const { navigate, pending } = useQueryNavigation();
  const pagination = usePagination({ total, view, navigate });
  return (
    <PersistedDataTable
      tableId="workOrder.list"
      className={cn(pending && "opacity-60 transition-opacity")}
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      emptyText={t("noMatches")}
      pagination={pagination}
      manualSorting
      sorting={[{ id: view.sort, desc: view.direction === "desc" }]}
      onSortingChange={(sorting) => navigate({ patch: sortPatch({ sorting }) })}
    />
  );
}
