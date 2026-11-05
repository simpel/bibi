"use client";

import { ContextMenuItem, cn, DataTableRowActions, type SortingState } from "@bibi/ui";
import { CalendarIcon, ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { Link, useRouter } from "@/lib/navigation";
import { listItemRoute, ROUTES } from "@/lib/routes";
import { useDataTablePaginationLabels } from "@/lib/use-data-table-pagination-labels";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import { RUN_SHEET_PAGE_SIZES, type RunSheetListParams } from "../lib/list-params";
import type { RunSheetRow } from "../lib/run-sheet-rows";
import { useRunSheetColumns } from "./use-run-sheet-columns";

export type RunSheetTableProps = {
  rows: RunSheetRow[];
  total: number;
  view: Pick<RunSheetListParams, "page" | "pageSize" | "sort" | "direction">;
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
}: Pick<RunSheetTableProps, "total" | "view"> & { navigate: Navigate }) {
  const t = useTranslations("runSheet.list");
  const labels = useDataTablePaginationLabels({ total: (count) => t("total", { count }) });
  return {
    pageIndex: view.page - 1,
    pageSize: view.pageSize,
    pageCount: Math.ceil(total / view.pageSize),
    totalCount: total,
    pageSizeOptions: RUN_SHEET_PAGE_SIZES,
    labels,
    onPaginationChange: ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) =>
      navigate({ patch: { page: String(pageIndex + 1), pageSize: String(pageSize) } }),
  };
}

function RunSheetRowMenu({ row }: { row: RunSheetRow }) {
  const t = useTranslations("runSheet.list");
  const common = useTranslations("common");
  return (
    <>
      <ContextMenuItem asChild>
        <Link href={listItemRoute({ list: ROUTES.runSheets, id: row.id })}>
          <ExternalLinkIcon />
          {common("open")}
        </Link>
      </ContextMenuItem>
      <ContextMenuItem asChild>
        <Link href={listItemRoute({ list: ROUTES.orders, id: row.orderId })}>
          <CalendarIcon />
          {t("columns.order")}
        </Link>
      </ContextMenuItem>
    </>
  );
}

/** Run sheet versions, paged, sorted and searched on the server: the URL holds the state. */
export function RunSheetTable({ rows, total, view }: RunSheetTableProps) {
  const t = useTranslations("runSheet.list");
  const common = useTranslations("common");
  const router = useRouter();
  const { navigate, pending } = useQueryNavigation();
  const pagination = usePagination({ total, view, navigate });
  const columns = useRunSheetColumns({
    renderActions: (row) => (
      <DataTableRowActions
        label={common("actions")}
        primary={[
          {
            label: common("open"),
            icon: ExternalLinkIcon,
            onClick: () => router.push(listItemRoute({ list: ROUTES.runSheets, id: row.id })),
          },
        ]}
      />
    ),
  });
  return (
    <PersistedDataTable
      tableId="runSheet.list"
      className={cn(pending && "opacity-60 transition-opacity")}
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(listItemRoute({ list: ROUTES.runSheets, id: row.id }))}
      rowMenu={(row) => <RunSheetRowMenu row={row} />}
      emptyText={t("noMatches")}
      pagination={pagination}
      manualSorting
      sorting={[{ id: view.sort, desc: view.direction === "desc" }]}
      onSortingChange={(sorting) => navigate({ patch: sortPatch({ sorting }) })}
    />
  );
}
