"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useOptionCardColumns } from "./use-option-card-columns";

export type OptionQueueViewProps = GenerativeProps<"option-queue">;

/** Options in queue order: rank (or final status), held period and expiry; links to the item. */
export function OptionQueueView({ items, nextCursor }: OptionQueueViewProps) {
  const t = useTranslations("assistant.ui.option");
  const columns = useOptionCardColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="option-queue" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.option"
        columns={columns}
        data={items}
        getRowId={(option) => option.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
