import type { TicketStatusDto } from "@bibi/core/schemas";
import { actionsColumn, Badge, ColorSwatch, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RowAccess } from "@/lib/can";
import type { StatusRow } from "./status-rows";
import { TicketStatusRowActions } from "./ticket-status-row-actions";

type Column = ColumnDef<StatusRow>;

type Translate = ReturnType<typeof useTranslations<"ticketStatus">>;

/** The flags a status has, as badges (ADR 0043). */
const flagsColumn = ({ t }: { t: Translate }): Column => ({
  id: "flags",
  header: t("columns.flags"),
  accessorFn: (row) => row.flags.map((flag) => t(`flags.${flag}`)).join(", "),
  cell: ({ row: { original: row } }) => (
    <span className="flex flex-wrap gap-1">
      {row.flags.map((flag) => (
        <Badge key={flag} variant="outline">
          {t(`flags.${flag}`)}
        </Badge>
      ))}
    </span>
  ),
});

export type StatusColumnsInput = { statuses: TicketStatusDto[]; access: RowAccess };

/** Name (with color), flags and allowed transitions; admins also get the row actions. */
export function useStatusColumns({ statuses, access }: StatusColumnsInput): Column[] {
  const t = useTranslations("ticketStatus");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const columns: Column[] = [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (row) => row.ticketStatus.name,
        cell: ({ row: { original: row } }) => (
          <span className="inline-flex items-center gap-2 font-medium">
            <ColorSwatch color={row.ticketStatus.color} />
            {row.ticketStatus.name}
          </span>
        ),
      },
      flagsColumn({ t }),
      {
        id: "transitions",
        header: t("columns.transitions"),
        accessorFn: (row) => row.targets.join(", ") || t("noTransitions"),
      },
    ];
    if (!access.canEdit && !access.canRemove) return columns;
    const actions = actionsColumn<StatusRow>({
      label: common("actions"),
      cell: ({ ticketStatus, index }) => (
        <TicketStatusRowActions
          ticketStatus={ticketStatus}
          index={index}
          statuses={statuses}
          access={access}
        />
      ),
    });
    return [...columns, actions];
  }, [t, common, statuses, access]);
}
