"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useItemStateViewColumns } from "./use-item-state-view-columns";

export type ItemStateTableViewProps = GenerativeProps<"item-state-table">;

/** Item states per type in order; names link to the item type's page (ADR 0044). */
export function ItemStateTableView({ items, nextCursor }: ItemStateTableViewProps) {
  const t = useTranslations("assistant.ui.itemState");
  const columns = useItemStateViewColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="item-state-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="item-state.assistant"
        columns={columns}
        data={items}
        getRowId={(state) => state.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
