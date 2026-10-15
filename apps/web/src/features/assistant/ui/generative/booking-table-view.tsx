"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { bookingRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { occupancyPeriod } from "./occupancy-period";

export type BookingTableViewProps = GenerativeProps<"booking-table">;

/** A page of bookings; each reference links to the booking page. */
export function BookingTableView({ items, nextCursor }: BookingTableViewProps) {
  const t = useTranslations("assistant.ui.booking");
  const format = useFormatter();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="booking-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.reference")}</TableHead>
            <TableHead>{t("columns.when")}</TableHead>
            <TableHead>{t("columns.headcount")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">
                <Link href={bookingRoute({ id: booking.id })} className="hover:underline">
                  {t("reference", { reference: booking.reference })}
                </Link>
              </TableCell>
              <TableCell>
                {occupancyPeriod({ format, startsAt: booking.startsAt, endsAt: booking.endsAt })}
              </TableCell>
              <TableCell>{booking.estimatedHeadcount ?? "–"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
