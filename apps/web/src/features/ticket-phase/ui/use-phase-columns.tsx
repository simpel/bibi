import type { TicketPhaseDto } from "@okazi/core/schemas";
import { actionsColumn, Badge, ColorSwatch, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { PhaseRow } from "./phase-rows";
import { TicketPhaseRowActions } from "./ticket-phase-row-actions";

type Column = ColumnDef<PhaseRow>;

type Translate = ReturnType<typeof useTranslations<"ticketPhase">>;

/** The flags a phase has, as badges (ADR 0043). */
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

export type PhaseColumnsInput = { phases: TicketPhaseDto[]; canAdmin: boolean };

/** Name (with color), flags and allowed transitions; admins also get the row actions. */
export function usePhaseColumns({ phases, canAdmin }: PhaseColumnsInput): Column[] {
  const t = useTranslations("ticketPhase");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const columns: Column[] = [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (row) => row.phase.name,
        cell: ({ row: { original: row } }) => (
          <span className="inline-flex items-center gap-2 font-medium">
            <ColorSwatch color={row.phase.color} />
            {row.phase.name}
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
    if (!canAdmin) return columns;
    const actions = actionsColumn<PhaseRow>({
      label: common("actions"),
      cell: ({ phase, index }) => (
        <TicketPhaseRowActions phase={phase} index={index} phases={phases} />
      ),
    });
    return [...columns, actions];
  }, [t, common, phases, canAdmin]);
}
