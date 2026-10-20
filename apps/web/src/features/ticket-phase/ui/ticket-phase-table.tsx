"use client";

import type { TicketPhaseDto } from "@okazi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import { toPhaseRows } from "./phase-rows";
import { usePhaseColumns } from "./use-phase-columns";

export type TicketPhaseTableProps = { phases: TicketPhaseDto[]; access: RowAccess };

/** The organization's phases: name, phase and allowed transitions; admins get row actions. */
export function TicketPhaseTable({ phases, access }: TicketPhaseTableProps) {
  const t = useTranslations("ticketPhase");
  const columns = usePhaseColumns({ phases, access });
  const rows = useMemo(() => toPhaseRows({ phases }), [phases]);
  return (
    <PersistedDataTable
      tableId="ticket-phase.list"
      columns={columns}
      data={rows}
      getRowId={(row) => row.phase.id}
      emptyText={t("empty")}
    />
  );
}
