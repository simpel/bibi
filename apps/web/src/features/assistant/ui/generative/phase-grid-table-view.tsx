"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { usePhaseGridViewColumns } from "./use-phase-grid-view-columns";

export type PhaseGridTableViewProps = GenerativeProps<"phase-grid-table">;

/** The set cells of the phase grid: phase, item type and the state lines move to (ADR 0044). */
export function PhaseGridTableView({ cells }: PhaseGridTableViewProps) {
  const t = useTranslations("assistant.ui.phaseGrid");
  const columns = usePhaseGridViewColumns();
  if (cells.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="phase-grid-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="phase-grid.assistant"
        columns={columns}
        data={cells}
        getRowId={(cell) => cell.id}
        emptyText={t("empty")}
      />
    </Card>
  );
}
