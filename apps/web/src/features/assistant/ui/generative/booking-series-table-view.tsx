"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { bookingSeriesRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type BookingSeriesTableViewProps = GenerativeProps<"booking-series-table">;

/** A page of series; each rule links to the series page. */
export function BookingSeriesTableView({ items, nextCursor }: BookingSeriesTableViewProps) {
  const t = useTranslations("assistant.ui.bookingSeries");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="booking-series-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.rule")}</TableHead>
            <TableHead>{t("columns.occurrences")}</TableHead>
            <TableHead>{t("columns.clashes")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((series) => (
            <TableRow key={series.id}>
              <TableCell className="font-medium">
                <Link href={bookingSeriesRoute({ id: series.id })} className="hover:underline">
                  {series.rule}
                </Link>
              </TableCell>
              <TableCell>{series.occurrences.length}</TableCell>
              <TableCell>{series.clashes.length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
