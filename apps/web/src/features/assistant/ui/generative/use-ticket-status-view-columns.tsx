import { STATUS_FLAGS } from "@bibi/core/schemas";
import { ColorSwatch, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ticketStatusesRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import type { TicketStatusTableViewProps } from "./ticket-status-table-view";

type Row = TicketStatusTableViewProps["items"][number];

/** Name (link), flags and transition count of the statuses in the chat card. */
export function useTicketStatusViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.ticketStatus");
  const flags = useTranslations("ticketStatus.flags");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (ticketStatus) => ticketStatus.name,
        cell: ({ row: { original: ticketStatus } }) => (
          <Link
            href={ticketStatusesRoute()}
            className="inline-flex items-center gap-2 font-medium hover:underline"
          >
            <ColorSwatch color={ticketStatus.color} />
            {ticketStatus.name}
          </Link>
        ),
      },
      {
        id: "flags",
        header: t("columns.flags"),
        accessorFn: (ticketStatus) =>
          STATUS_FLAGS.filter((flag) => ticketStatus[flag])
            .map((flag) => flags(flag))
            .join(", "),
      },
      {
        id: "transitions",
        header: t("columns.transitions"),
        accessorFn: (ticketStatus) => ticketStatus.transitionsTo.length,
        cell: ({ row }) => t("transitions", { count: row.original.transitionsTo.length }),
      },
    ],
    [t, flags],
  );
}
