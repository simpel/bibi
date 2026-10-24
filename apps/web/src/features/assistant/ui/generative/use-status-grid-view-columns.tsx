import { ColorSwatch, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { StatusGridTableViewProps } from "./status-grid-table-view";

type Row = StatusGridTableViewProps["cells"][number];

/** Status · item type · state of each set grid cell in the chat card. */
export function useStatusGridViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.statusGrid");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      { id: "status", header: t("columns.status"), accessorFn: (cell) => cell.statusName },
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
