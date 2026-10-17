import type { BookingStatusDto } from "@okazi/core/schemas";
import { actionsColumn, Badge, ColorSwatch, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { BookingStatusRowActions } from "./booking-status-row-actions";
import type { StatusRow } from "./status-rows";

type Column = ColumnDef<StatusRow>;

export type StatusColumnsInput = { statuses: BookingStatusDto[]; canAdmin: boolean };

/** Name (with color), phase and allowed transitions; admins also get the row actions. */
export function useStatusColumns({ statuses, canAdmin }: StatusColumnsInput): Column[] {
  const t = useTranslations("bookingStatus");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const columns: Column[] = [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (row) => row.status.name,
        cell: ({ row: { original: row } }) => (
          <span className="inline-flex items-center gap-2 font-medium">
            <ColorSwatch color={row.status.color} />
            {row.status.name}
            {row.isDefault ? <Badge variant="outline">{t("default")}</Badge> : null}
          </span>
        ),
      },
      {
        id: "phase",
        header: t("columns.phase"),
        accessorFn: (row) => t(`phases.${row.status.phase}`),
      },
      {
        id: "transitions",
        header: t("columns.transitions"),
        accessorFn: (row) => row.targets.join(", ") || t("noTransitions"),
      },
    ];
    if (!canAdmin) return columns;
    const actions = actionsColumn<StatusRow>({
      label: common("actions"),
      cell: ({ status, index }) => (
        <BookingStatusRowActions status={status} index={index} statuses={statuses} />
      ),
    });
    return [...columns, actions];
  }, [t, common, statuses, canAdmin]);
}
