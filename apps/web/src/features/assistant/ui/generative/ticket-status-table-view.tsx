"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useTicketStatusViewColumns } from "./use-ticket-status-view-columns";

export type TicketStatusTableViewProps = GenerativeProps<"ticket-status-table">;

/** Ticket statuses in order; names link to the ticket statuses settings page. */
export function TicketStatusTableView({ items, nextCursor }: TicketStatusTableViewProps) {
  const t = useTranslations("assistant.ui.ticketStatus");
  const columns = useTicketStatusViewColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="ticket-status-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="ticket-status.assistant"
        columns={columns}
        data={items}
        getRowId={(status) => status.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
