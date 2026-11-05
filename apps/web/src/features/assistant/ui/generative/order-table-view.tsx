"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useOrderViewColumns } from "./use-order-view-columns";

export type OrderTableViewProps = GenerativeProps<"order-table">;

/** A page of orders; each title links to the order page. */
export function OrderTableView({ items, nextCursor }: OrderTableViewProps) {
  const t = useTranslations("assistant.ui.order");
  const columns = useOrderViewColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="order-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="order.assistant"
        columns={columns}
        data={items}
        getRowId={(order) => order.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
