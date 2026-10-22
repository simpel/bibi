import { PHASE_FLAGS } from "@bibi/core/schemas";
import { Link } from "@bibi/i18n/navigation";
import { ColorSwatch, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ticketPhasesRoute } from "@/lib/configuration-routes";
import type { TicketPhaseTableViewProps } from "./ticket-phase-table-view";

type Row = TicketPhaseTableViewProps["items"][number];

/** Name (link), flags and transition count of the phases in the chat card. */
export function useTicketPhaseViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.ticketPhase");
  const flags = useTranslations("ticketPhase.flags");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (phase) => phase.name,
        cell: ({ row: { original: phase } }) => (
          <Link
            href={ticketPhasesRoute()}
            className="inline-flex items-center gap-2 font-medium hover:underline"
          >
            <ColorSwatch color={phase.color} />
            {phase.name}
          </Link>
        ),
      },
      {
        id: "flags",
        header: t("columns.flags"),
        accessorFn: (phase) =>
          PHASE_FLAGS.filter((flag) => phase[flag])
            .map((flag) => flags(flag))
            .join(", "),
      },
      {
        id: "transitions",
        header: t("columns.transitions"),
        accessorFn: (phase) => phase.transitionsTo.length,
        cell: ({ row }) => t("transitions", { count: row.original.transitionsTo.length }),
      },
    ],
    [t, flags],
  );
}
