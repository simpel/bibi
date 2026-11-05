"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useOrderTemplateViewColumns } from "./use-order-template-view-columns";

export type OrderTemplateTableViewProps = GenerativeProps<"order-template-table">;

/** Predefined orders by name; names link to the predefined orders settings page. */
export function OrderTemplateTableView({ items, nextCursor }: OrderTemplateTableViewProps) {
  const t = useTranslations("assistant.ui.orderTemplate");
  const columns = useOrderTemplateViewColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="order-template-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="order-template.assistant"
        columns={columns}
        data={items}
        getRowId={(template) => template.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
