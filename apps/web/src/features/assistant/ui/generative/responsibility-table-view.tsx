"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useResponsibilityCardColumns } from "./use-responsibility-card-columns";

export type ResponsibilityTableViewProps = GenerativeProps<"responsibility-table">;

/** A page of responsibilities; names link to the responsibilities settings page. */
export function ResponsibilityTableView({ items, nextCursor }: ResponsibilityTableViewProps) {
  const t = useTranslations("assistant.ui.responsibility");
  const columns = useResponsibilityCardColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="responsibility-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.responsibility"
        columns={columns}
        data={items}
        getRowId={(responsibility) => responsibility.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
