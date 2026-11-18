"use client";

import type { OrderCue, OrderDto } from "@bibi/core";
import { cn, type SortingState } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { flagAttention } from "@/features/my-work/lib/flag-level";
import { useRouter } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";
import { useDataTablePaginationLabels } from "@/lib/use-data-table-pagination-labels";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import { ORDER_PAGE_SIZES, type OrderListParams } from "../lib/list-params";
import { OrderCueBadges } from "./order-cue-badges";
import { OrderRowActions, OrderRowMenu } from "./order-row-actions";
import { type OrderLookups, useOrderColumns } from "./use-order-columns";

export type OrderTablePage = Pick<OrderListParams, "page" | "pageSize" | "sort" | "direction">;

export type OrderTableProps = Omit<OrderLookups, "renderActions"> & {
  orders: OrderDto[];
  total: number;
  view: OrderTablePage;
  canEdit?: boolean | undefined;
  /** Card cues by order id (preliminary, flags), the same as on the pipeline. */
  cues?: Readonly<Record<string, OrderCue>> | undefined;
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
export function OrderTable({
  orders,
  total,
  view,
  canEdit = false,
  cues = {},
  ...lookups
}: OrderTableProps) {
  const t = useTranslations("order");
  const columns = useOrderColumns({
    ...lookups,
    renderActions: (order) => <OrderRowActions order={order} canEdit={canEdit} />,
    renderIssues: (order) => (
      <OrderCueBadges
        flags={cues[order.id]?.flags ?? []}
        tentative={cues[order.id]?.soft ?? false}
      />
    ),
  });
  const now = Date.now();
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
      rowSurface={(order) => ({
        attention:
          flagAttention({ flags: cues[order.id]?.flags ?? [] }) ??
          (cues[order.id]?.soft ? "warning" : null),
        done: order.desiredEndsAt !== null && new Date(order.desiredEndsAt).getTime() <= now,
      })}
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
