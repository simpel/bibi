"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useTicketPhaseViewColumns } from "./use-ticket-phase-view-columns";

export type TicketPhaseTableViewProps = GenerativeProps<"ticket-phase-table">;

/** Ticket phases in order; names link to the ticket phases settings page. */
export function TicketPhaseTableView({ items, nextCursor }: TicketPhaseTableViewProps) {
  const t = useTranslations("assistant.ui.ticketPhase");
  const columns = useTicketPhaseViewColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="ticket-phase-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="ticket-phase.assistant"
        columns={columns}
        data={items}
        getRowId={(status) => status.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
