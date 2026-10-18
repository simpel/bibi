import { ColorSwatch, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { PhaseGridTableViewProps } from "./phase-grid-table-view";

type Row = PhaseGridTableViewProps["cells"][number];

/** Phase · item type · state of each set grid cell in the chat card. */
export function usePhaseGridViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.phaseGrid");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      { id: "phase", header: t("columns.phase"), accessorFn: (cell) => cell.phaseName },
      { id: "type", header: t("columns.type"), accessorFn: (cell) => cell.entityTypeName },
      {
        id: "state",
        header: t("columns.state"),
        accessorFn: (cell) => cell.stateName,
        cell: ({ row: { original: cell } }) => (
          <span className="inline-flex items-center gap-2">
            <ColorSwatch color={cell.stateColor} />
            {cell.stateName}
          </span>
        ),
      },
    ],
    [t],
  );
}
