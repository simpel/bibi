import type { OccupancyDto } from "@okazi/core";
import { MANUAL_OCCUPANCY_TYPES } from "@okazi/core/schemas";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { OccupancyRowActions } from "./occupancy-row-actions";

type Column = ColumnDef<OccupancyDto>;

const isManual = ({ type }: OccupancyDto) =>
  (MANUAL_OCCUPANCY_TYPES as readonly string[]).includes(type);

/** Type · note · starts · ends, plus the row actions (manual blocks only) when writable. */
export function useOccupancyColumns({ canWrite }: { canWrite: boolean }): Column[] {
  const t = useTranslations("occupancy");
  const common = useTranslations("common");
  const format = useFormatter();
  return useMemo<Column[]>(() => {
    const when = ({ date }: { date: Date }) =>
      format.dateTime(date, { dateStyle: "medium", timeStyle: "short" });
    const columns: Column[] = [
      { id: "type", header: t("columns.type"), accessorFn: (o) => t(`types.${o.type}`) },
      {
        id: "note",
        header: t("columns.note"),
        accessorFn: (o) => o.note ?? undefined,
        cell: ({ row }) => row.original.note ?? "–",
      },
      {
        id: "startsAt",
        header: t("columns.startsAt"),
        accessorFn: (o) => o.startsAt,
        cell: ({ row }) => when({ date: row.original.startsAt }),
      },
      {
        id: "endsAt",
        header: t("columns.endsAt"),
        accessorFn: (o) => o.endsAt,
        cell: ({ row }) => when({ date: row.original.endsAt }),
      },
    ];
    if (!canWrite) return columns;
    return [
      ...columns,
      actionsColumn<OccupancyDto>({
        label: common("actions"),
        cell: (o) => (isManual(o) ? <OccupancyRowActions occupancy={o} /> : null),
      }),
    ];
  }, [t, common, format, canWrite]);
}
