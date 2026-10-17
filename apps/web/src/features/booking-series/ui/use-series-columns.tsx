import type { BookingSeriesDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Badge, type ColumnDef } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { namedOptionColumn } from "@/components/data-table/named-option-column";
import type { NamedOption } from "@/components/form/named-option";
import { bookingSeriesRoute } from "@/lib/routes";

type Column = ColumnDef<BookingSeriesDto>;
type Translate = ReturnType<typeof useTranslations<"bookingSeries">>;

const START = { dateStyle: "medium", timeStyle: "short" } as const;

const ruleColumn = ({ t }: { t: Translate }): Column => ({
  id: "rule",
  header: t("columns.rule"),
  accessorFn: (series) => series.rule,
  cell: ({ row: { original: series } }) => (
    <Link href={bookingSeriesRoute({ id: series.id })} className="font-medium hover:underline">
      {series.rule}
    </Link>
  ),
});

const clashesColumn = ({ t }: { t: Translate }): Column => ({
  id: "clashes",
  header: t("columns.clashes"),
  accessorFn: (series) => series.clashes.length,
  cell: ({ row: { original: series } }) =>
    series.clashes.length > 0 ? (
      <Badge variant="warning">{t("clashCount", { count: series.clashes.length })}</Badge>
    ) : (
      "–"
    ),
});

/** Rule (link), customer, clashes, first start and occurrence count of a series. */
export function useSeriesColumns({ customers }: { customers: NamedOption[] }): Column[] {
  const t = useTranslations("bookingSeries");
  const format = useFormatter();
  return useMemo<Column[]>(
    () => [
      ruleColumn({ t }),
      namedOptionColumn({
        id: "customer",
        header: t("columns.customer"),
        options: customers,
        pick: (series: BookingSeriesDto) => series.customerId,
      }),
      clashesColumn({ t }),
      {
        id: "startsAt",
        header: t("columns.startsAt"),
        accessorFn: (series) => series.startsAt,
        cell: ({ row }) => format.dateTime(row.original.startsAt, START),
      },
      {
        id: "occurrences",
        header: t("columns.occurrences"),
        accessorFn: (series) => series.occurrences.length,
      },
    ],
    [t, format, customers],
  );
}
