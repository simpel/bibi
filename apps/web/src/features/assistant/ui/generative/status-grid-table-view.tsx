"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { useStatusGridViewColumns } from "./use-status-grid-view-columns";

export type StatusGridTableViewProps = GenerativeProps<"status-grid-table">;

/** The set cells of the status grid: status, item type and the state lines move to (ADR 0044). */
export function StatusGridTableView({ cells }: StatusGridTableViewProps) {
  const t = useTranslations("assistant.ui.statusGrid");
  const columns = useStatusGridViewColumns();
  if (cells.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="status-grid-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="status-grid.assistant"
        columns={columns}
        data={cells}
        getRowId={(cell) => cell.id}
        emptyText={t("empty")}
      />
    </Card>
  );
}
