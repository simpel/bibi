"use client";

import type { BookingStatusDto } from "@okazi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { toStatusRows } from "./status-rows";
import { useStatusColumns } from "./use-status-columns";

export type BookingStatusTableProps = { statuses: BookingStatusDto[]; canAdmin: boolean };

/** The organization's statuses: name, phase and allowed transitions; admins get row actions. */
export function BookingStatusTable({ statuses, canAdmin }: BookingStatusTableProps) {
  const t = useTranslations("bookingStatus");
  const columns = useStatusColumns({ statuses, canAdmin });
  const rows = useMemo(() => toStatusRows({ statuses }), [statuses]);
  return (
    <PersistedDataTable
      tableId="booking-status.list"
      columns={columns}
      data={rows}
      getRowId={(row) => row.status.id}
      emptyText={t("empty")}
    />
  );
}
