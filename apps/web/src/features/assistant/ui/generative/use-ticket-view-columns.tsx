import type { ColumnDef } from "@bibi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { desiredPeriod } from "@/features/ticket/ui/desired-period";
import { Link } from "@/lib/navigation";
import { ticketRoute } from "@/lib/routes";
import type { TicketTableViewProps } from "./ticket-table-view";

type Row = TicketTableViewProps["items"][number];

/** Reference (link), desired period and headcount of the tickets in the chat card. */
export function useTicketViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.ticket");
  const format = useFormatter();
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "reference",
        header: t("columns.reference"),
        accessorFn: (ticket) => ticket.reference,
        cell: ({ row: { original: ticket } }) => (
          <Link href={ticketRoute({ id: ticket.id })} className="font-medium hover:underline">
            {t("reference", { reference: ticket.reference })}
          </Link>
        ),
      },
      {
        id: "when",
        header: t("columns.when"),
        accessorFn: (ticket) => ticket.desiredStartsAt,
        cell: ({ row: { original: ticket } }) => desiredPeriod({ ticket, format }),
      },
      {
        id: "headcount",
        header: t("columns.headcount"),
        accessorFn: (ticket) => ticket.estimatedHeadcount,
      },
    ],
    [t, format],
  );
}
