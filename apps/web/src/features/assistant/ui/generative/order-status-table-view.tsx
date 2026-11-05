"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useOrderStatusViewColumns } from "./use-order-status-view-columns";

export type OrderStatusTableViewProps = GenerativeProps<"order-status-table">;

/** Order statuses in order; names link to the order statuses settings page. */
export function OrderStatusTableView({ items, nextCursor }: OrderStatusTableViewProps) {
  const t = useTranslations("assistant.ui.orderStatus");
  const columns = useOrderStatusViewColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="order-status-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="order-status.assistant"
        columns={columns}
        data={items}
        getRowId={(status) => status.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
