"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useTicketViewColumns } from "./use-ticket-view-columns";

export type TicketTableViewProps = GenerativeProps<"ticket-table">;

/** A page of tickets; each reference links to the ticket page. */
export function TicketTableView({ items, nextCursor }: TicketTableViewProps) {
  const t = useTranslations("assistant.ui.ticket");
  const columns = useTicketViewColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="ticket-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="ticket.assistant"
        columns={columns}
        data={items}
        getRowId={(ticket) => ticket.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
