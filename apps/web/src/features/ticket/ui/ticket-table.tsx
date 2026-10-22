"use client";

import type { TicketDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { type TicketLookups, useTicketColumns } from "./use-ticket-columns";

export type TicketTableProps = TicketLookups & { tickets: TicketDto[] };

/** Ticket rows: reference (link), customer, type, phase, desired period and quantity. */
export function TicketTable({ tickets, ...lookups }: TicketTableProps) {
  const t = useTranslations("ticket");
  const columns = useTicketColumns(lookups);
  return (
    <PersistedDataTable
      tableId="ticket.list"
      columns={columns}
      data={tickets}
      getRowId={(ticket) => ticket.id}
      emptyText={t("empty")}
    />
  );
}
