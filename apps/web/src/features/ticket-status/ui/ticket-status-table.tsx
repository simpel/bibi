"use client";

import type { TicketStatusDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import { toStatusRows } from "./status-rows";
import { useStatusColumns } from "./use-status-columns";

export type TicketStatusTableProps = { statuses: TicketStatusDto[]; access: RowAccess };

/** The organization's statuses: name, status and allowed transitions; admins get row actions. */
export function TicketStatusTable({ statuses, access }: TicketStatusTableProps) {
  const t = useTranslations("ticketStatus");
  const columns = useStatusColumns({ statuses, access });
  const rows = useMemo(() => toStatusRows({ statuses }), [statuses]);
  return (
    <PersistedDataTable
      tableId="ticket-status.list"
      columns={columns}
      data={rows}
      getRowId={(row) => row.ticketStatus.id}
      emptyText={t("empty")}
    />
  );
}
