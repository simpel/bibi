"use client";

import type { TicketDto } from "@bibi/core";
import { cn, type SortingState } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useDataTablePaginationLabels } from "@/lib/use-data-table-pagination-labels";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import { TICKET_PAGE_SIZES, type TicketListParams } from "../lib/list-params";
import { type TicketLookups, useTicketColumns } from "./use-ticket-columns";

export type TicketTablePage = Pick<TicketListParams, "page" | "pageSize" | "sort" | "direction">;

export type TicketTableProps = TicketLookups & {
  tickets: TicketDto[];
  total: number;
  view: TicketTablePage;
};

type Navigate = ReturnType<typeof useQueryNavigation>["navigate"];

/** The URL patch for a new sort: none clears it back to the newest reference first. */
const sortPatch = ({ sorting }: { sorting: SortingState }) => {
  const [next] = sorting;
  return next ? { sort: next.id, dir: next.desc ? "desc" : "asc" } : { sort: null, dir: null };
};

function usePagination({
  total,
  view,
  navigate,
}: Pick<TicketTableProps, "total" | "view"> & {
  navigate: Navigate;
}) {
  const t = useTranslations("ticket");
  const labels = useDataTablePaginationLabels({ total: (count) => t("listTotal", { count }) });
  return {
    pageIndex: view.page - 1,
    pageSize: view.pageSize,
    pageCount: Math.ceil(total / view.pageSize),
    totalCount: total,
    pageSizeOptions: TICKET_PAGE_SIZES,
    labels,
    onPaginationChange: ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) =>
      navigate({ patch: { page: String(pageIndex + 1), pageSize: String(pageSize) } }),
  };
}

/**
 * Ticket rows, paged, sorted and searched on the server (the list may hold 100 000 tickets): the
 * URL holds the state and every change renders the next page there.
 */
export function TicketTable({ tickets, total, view, ...lookups }: TicketTableProps) {
  const t = useTranslations("ticket");
  const columns = useTicketColumns(lookups);
  const { navigate, pending } = useQueryNavigation();
  const pagination = usePagination({ total, view, navigate });
  return (
    <PersistedDataTable
      tableId="ticket.list"
      className={cn(pending && "opacity-60 transition-opacity")}
      columns={columns}
      data={tickets}
      getRowId={(ticket) => ticket.id}
      emptyText={t("noMatches")}
      pagination={pagination}
      manualSorting
      sorting={[{ id: view.sort, desc: view.direction === "desc" }]}
      onSortingChange={(sorting) => navigate({ patch: sortPatch({ sorting }) })}
    />
  );
}
