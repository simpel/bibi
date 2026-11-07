"use client";

import type { OrderStatusDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { OrderStatusRowMenu, orderStatusEditHref } from "./order-status-row-actions";
import { type StatusRow, toStatusRows } from "./status-rows";
import { useStatusColumns } from "./use-status-columns";

export type OrderStatusTableProps = { statuses: OrderStatusDto[]; access: RowAccess };

const NO_QUALIFIERS: TableQualifier<StatusRow>[] = [];

/** The organization's statuses in board order: name, flags and allowed transitions. */
export function OrderStatusTable({ statuses, access }: OrderStatusTableProps) {
  const t = useTranslations("orderStatus");
  const router = useRouter();
  const columns = useStatusColumns({ statuses, access });
  const rows = useMemo(() => toStatusRows({ statuses }), [statuses]);
  const view = useClientTableView({
    rows,
    qualifiers: NO_QUALIFIERS,
    getSearchText: (row) => row.orderStatus.name,
    totalLabel: (count) => `${count}`,
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} />
      <PersistedDataTable
        tableId="order-status.list"
        columns={columns}
        data={view.rows}
        getRowId={(row) => row.orderStatus.id}
        {...(access.canEdit
          ? {
              onRowClick: (row: StatusRow) =>
                router.push(orderStatusEditHref({ id: row.orderStatus.id })),
            }
          : {})}
        rowMenu={(row) => <OrderStatusRowMenu orderStatus={row.orderStatus} access={access} />}
        emptyText={t("empty")}
        pagination={view.pagination}
      />
    </div>
  );
}
