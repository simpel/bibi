import { Link } from "@okazi/i18n/navigation";
import { ColorSwatch, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { bookingStatusesRoute } from "@/lib/configuration-routes";
import type { BookingStatusTableViewProps } from "./booking-status-table-view";

type Row = BookingStatusTableViewProps["items"][number];

/** Name (link), phase and transition count of the statuses in the chat card. */
export function useBookingStatusViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.bookingStatus");
  const phases = useTranslations("bookingStatus.phases");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (status) => status.name,
        cell: ({ row: { original: status } }) => (
          <Link
            href={bookingStatusesRoute()}
            className="inline-flex items-center gap-2 font-medium hover:underline"
          >
            <ColorSwatch color={status.color} />
            {status.name}
          </Link>
        ),
      },
      {
        id: "phase",
        header: t("columns.phase"),
        accessorFn: (status) => phases(status.phase),
      },
      {
        id: "transitions",
        header: t("columns.transitions"),
        accessorFn: (status) => status.transitionsTo.length,
        cell: ({ row }) => t("transitions", { count: row.original.transitionsTo.length }),
      },
    ],
    [t, phases],
  );
}
