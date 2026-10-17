import { Link } from "@okazi/i18n/navigation";
import type { ColumnDef } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { bookingRoute } from "@/lib/routes";
import type { BookingTableViewProps } from "./booking-table-view";
import { occupancyPeriod } from "./occupancy-period";

type Row = BookingTableViewProps["items"][number];

/** Reference (link), time and headcount of the bookings in the chat card. */
export function useBookingViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.booking");
  const format = useFormatter();
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "reference",
        header: t("columns.reference"),
        accessorFn: (booking) => booking.reference,
        cell: ({ row: { original: booking } }) => (
          <Link href={bookingRoute({ id: booking.id })} className="font-medium hover:underline">
            {t("reference", { reference: booking.reference })}
          </Link>
        ),
      },
      {
        id: "when",
        header: t("columns.when"),
        accessorFn: (booking) => new Date(booking.startsAt),
        cell: ({ row: { original: b } }) =>
          occupancyPeriod({ format, startsAt: b.startsAt, endsAt: b.endsAt }),
      },
      {
        id: "headcount",
        header: t("columns.headcount"),
        accessorFn: (booking) => booking.estimatedHeadcount,
      },
    ],
    [t, format],
  );
}
