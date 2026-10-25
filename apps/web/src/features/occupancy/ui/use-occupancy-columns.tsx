import type { OccupancyDto } from "@bibi/core";
import { MANUAL_OCCUPANCY_TYPES } from "@bibi/core/schemas";
import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RowAccess } from "@/lib/can";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { OccupancyRowActions } from "./occupancy-row-actions";

type Column = ColumnDef<OccupancyDto>;

const isManual = ({ type }: OccupancyDto) =>
  (MANUAL_OCCUPANCY_TYPES as readonly string[]).includes(type);

export type UseOccupancyColumnsInput = {
  access: RowAccess;
  /** The zone of the item's venue: times show in it (ADR 0064). */
  timeZone: string;
};

/** Type · note · starts · ends, plus the row actions (manual blocks only) when writable. */
export function useOccupancyColumns({ access, timeZone }: UseOccupancyColumnsInput): Column[] {
  const t = useTranslations("occupancy");
  const common = useTranslations("common");
  const format = useDateTimeFormat();
  return useMemo<Column[]>(() => {
    const when = ({ date }: { date: Date }) => format.dateTime({ instant: date, timeZone });
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
    if (!access.canEdit && !access.canRemove) return columns;
    return [
      ...columns,
      actionsColumn<OccupancyDto>({
        label: common("actions"),
        cell: (o) =>
          isManual(o) ? <OccupancyRowActions {...{ occupancy: o, access, timeZone }} /> : null,
      }),
    ];
  }, [t, common, format, access, timeZone]);
}
