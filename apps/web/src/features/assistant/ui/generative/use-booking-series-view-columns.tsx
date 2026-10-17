import { Link } from "@okazi/i18n/navigation";
import type { ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { bookingSeriesRoute } from "@/lib/routes";
import type { BookingSeriesTableViewProps } from "./booking-series-table-view";

type Row = BookingSeriesTableViewProps["items"][number];

/** Rule (link), clash count and occurrence count of the series in the chat card. */
export function useBookingSeriesViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.bookingSeries");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "rule",
        header: t("columns.rule"),
        accessorFn: (series) => series.rule,
        cell: ({ row: { original: series } }) => (
          <Link
            href={bookingSeriesRoute({ id: series.id })}
            className="font-medium hover:underline"
          >
            {series.rule}
          </Link>
        ),
      },
      {
        id: "clashes",
        header: t("columns.clashes"),
        accessorFn: (series) => series.clashes.length,
      },
      {
        id: "occurrences",
        header: t("columns.occurrences"),
        accessorFn: (series) => series.occurrences.length,
      },
    ],
    [t],
  );
}
