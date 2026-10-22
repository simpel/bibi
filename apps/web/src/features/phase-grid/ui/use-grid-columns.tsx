import type { ColumnDef } from "@bibi/ui";
import { ColorSwatch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { TypeStates } from "@/features/item-state/load-item-state-data";
import { GridCell } from "./grid-cell";
import type { GridRow } from "./grid-rows";

export type GridColumnsInput = { types: readonly TypeStates[]; canEdit: boolean };

/** The phase down the side and one column per item type, each cell a state dropdown. */
export function useGridColumns({ types, canEdit }: GridColumnsInput): ColumnDef<GridRow>[] {
  const t = useTranslations("phaseGrid");
  return useMemo(() => {
    const phase: ColumnDef<GridRow> = {
      id: "phase",
      header: t("phase"),
      accessorFn: (row) => row.phase.name,
      cell: ({ row: { original: row } }) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <ColorSwatch color={row.phase.color} />
          {row.phase.name}
        </span>
      ),
    };
    const perType = types.map(
      ({ type, states }): ColumnDef<GridRow> => ({
        id: `type-${type.id}`,
        header: type.name,
        enableSorting: false,
        accessorFn: (row) => states.find((s) => s.id === row.cells[type.id])?.name ?? "",
        cell: ({ row: { original: row } }) =>
          row.phase.terminal ? (
            <span className="text-sm text-muted-foreground">{t("terminal")}</span>
          ) : (
            <GridCell
              phase={row.phase}
              type={type}
              states={states}
              stateId={row.cells[type.id] ?? null}
              canEdit={canEdit}
            />
          ),
      }),
    );
    return [phase, ...perType];
  }, [t, types, canEdit]);
}
