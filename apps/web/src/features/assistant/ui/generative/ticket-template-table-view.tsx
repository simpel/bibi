"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useTicketTemplateViewColumns } from "./use-ticket-template-view-columns";

export type TicketTemplateTableViewProps = GenerativeProps<"ticket-template-table">;

/** Predefined tickets by name; names link to the predefined tickets settings page. */
export function TicketTemplateTableView({ items, nextCursor }: TicketTemplateTableViewProps) {
  const t = useTranslations("assistant.ui.ticketTemplate");
  const columns = useTicketTemplateViewColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="ticket-template-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="ticket-template.assistant"
        columns={columns}
        data={items}
        getRowId={(template) => template.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
