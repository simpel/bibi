import type { BookingSeriesDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getFormatter, getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import { bookingSeriesRoute } from "@/lib/routes";
import type { SeriesFormData } from "./series-form-data";

export type BookingSeriesTableProps = { series: BookingSeriesDto[]; data: SeriesFormData };

/** Series rows: rule (link), customer, first start, occurrence count and clashes. */
export async function BookingSeriesTable({ series, data }: BookingSeriesTableProps) {
  const t = await getTranslations("bookingSeries");
  const format = await getFormatter();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.rule")}</TableHead>
          <TableHead>{t("columns.customer")}</TableHead>
          <TableHead>{t("columns.startsAt")}</TableHead>
          <TableHead>{t("columns.occurrences")}</TableHead>
          <TableHead>{t("columns.clashes")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {series.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">
              <Link href={bookingSeriesRoute({ id: row.id })} className="hover:underline">
                {row.rule}
              </Link>
            </TableCell>
            <TableCell>{nameOf({ options: data.customers, id: row.customerId })}</TableCell>
            <TableCell>
              {format.dateTime(row.startsAt, { dateStyle: "medium", timeStyle: "short" })}
            </TableCell>
            <TableCell>{row.occurrences.length}</TableCell>
            <TableCell>
              {row.clashes.length > 0 ? (
                <Badge variant="warning">{t("clashCount", { count: row.clashes.length })}</Badge>
              ) : (
                "–"
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
