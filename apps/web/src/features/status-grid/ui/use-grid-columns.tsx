import type { ColumnDef } from "@bibi/ui";
import { ColorSwatch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { TypeStates } from "@/features/item-state/load-item-state-data";
import { GridCell } from "./grid-cell";
import type { GridRow } from "./grid-rows";

export type GridColumnsInput = { types: readonly TypeStates[]; canEdit: boolean };

/** The status down the side and one column per item type, each cell a state dropdown. */
export function useGridColumns({ types, canEdit }: GridColumnsInput): ColumnDef<GridRow>[] {
  const t = useTranslations("statusGrid");
  return useMemo(() => {
    const ticketStatus: ColumnDef<GridRow> = {
      id: "status",
      header: t("status"),
      accessorFn: (row) => row.ticketStatus.name,
      cell: ({ row: { original: row } }) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <ColorSwatch color={row.ticketStatus.color} />
          {row.ticketStatus.name}
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
          row.ticketStatus.closes ? (
            <span className="text-sm text-muted-foreground">{t("closes")}</span>
          ) : (
            <GridCell
              ticketStatus={row.ticketStatus}
              type={type}
              states={states}
              stateId={row.cells[type.id] ?? null}
              canEdit={canEdit}
            />
          ),
      }),
    );
    return [ticketStatus, ...perType];
  }, [t, types, canEdit]);
}
