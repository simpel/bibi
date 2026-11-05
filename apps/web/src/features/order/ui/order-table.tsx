"use client";

import type { OrderDto } from "@bibi/core";
import { cn, type SortingState } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useRouter } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";
import { useDataTablePaginationLabels } from "@/lib/use-data-table-pagination-labels";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import { ORDER_PAGE_SIZES, type OrderListParams } from "../lib/list-params";
import { OrderRowActions, OrderRowMenu } from "./order-row-actions";
import { type OrderLookups, useOrderColumns } from "./use-order-columns";

export type OrderTablePage = Pick<OrderListParams, "page" | "pageSize" | "sort" | "direction">;

export type OrderTableProps = Omit<OrderLookups, "renderActions"> & {
  orders: OrderDto[];
  total: number;
  view: OrderTablePage;
  canEdit?: boolean | undefined;
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
}: Pick<OrderTableProps, "total" | "view"> & {
  navigate: Navigate;
}) {
  const t = useTranslations("order");
  const labels = useDataTablePaginationLabels({ total: (count) => t("listTotal", { count }) });
  return {
    pageIndex: view.page - 1,
    pageSize: view.pageSize,
    pageCount: Math.ceil(total / view.pageSize),
    totalCount: total,
    pageSizeOptions: ORDER_PAGE_SIZES,
    labels,
    onPaginationChange: ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) =>
      navigate({ patch: { page: String(pageIndex + 1), pageSize: String(pageSize) } }),
  };
}

/**
 * Order rows, paged, sorted and searched on the server (the list may hold 100 000 orders): the
 * URL holds the state and every change renders the next page there.
 */
export function OrderTable({ orders, total, view, canEdit = false, ...lookups }: OrderTableProps) {
  const t = useTranslations("order");
  const columns = useOrderColumns({
    ...lookups,
    renderActions: (order) => <OrderRowActions order={order} canEdit={canEdit} />,
  });
  const router = useRouter();
  const { navigate, pending } = useQueryNavigation();
  const pagination = usePagination({ total, view, navigate });
  return (
    <PersistedDataTable
      tableId="order.list"
      className={cn(pending && "opacity-60 transition-opacity")}
      columns={columns}
      data={orders}
      getRowId={(order) => order.id}
      onRowClick={(order) => router.push(orderRoute({ id: order.id }))}
      rowMenu={(order) => <OrderRowMenu order={order} canEdit={canEdit} />}
      emptyText={t("noMatches")}
      pagination={pagination}
      manualSorting
      sorting={[{ id: view.sort, desc: view.direction === "desc" }]}
      onSortingChange={(sorting) => navigate({ patch: sortPatch({ sorting }) })}
    />
  );
}
