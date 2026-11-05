"use client";

import type { OrderStatusDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import { toStatusRows } from "./status-rows";
import { useStatusColumns } from "./use-status-columns";

export type OrderStatusTableProps = { statuses: OrderStatusDto[]; access: RowAccess };

/** The organization's statuses: name, status and allowed transitions; admins get row actions. */
export function OrderStatusTable({ statuses, access }: OrderStatusTableProps) {
  const t = useTranslations("orderStatus");
  const columns = useStatusColumns({ statuses, access });
  const rows = useMemo(() => toStatusRows({ statuses }), [statuses]);
  return (
    <PersistedDataTable
      tableId="order-status.list"
      columns={columns}
      data={rows}
      getRowId={(row) => row.orderStatus.id}
      emptyText={t("empty")}
    />
  );
}
