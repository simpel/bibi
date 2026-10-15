"use client";

import { Link } from "@okazi/i18n/navigation";
import {
  Card,
  ColorSwatch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { bookingStatusesRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type BookingStatusTableViewProps = GenerativeProps<"booking-status-table">;

/** Booking statuses in order; names link to the booking statuses settings page. */
export function BookingStatusTableView({ items, nextCursor }: BookingStatusTableViewProps) {
  const t = useTranslations("assistant.ui.bookingStatus");
  const phases = useTranslations("bookingStatus.phases");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="booking-status-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.phase")}</TableHead>
            <TableHead>{t("columns.transitions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((status) => (
            <TableRow key={status.id}>
              <TableCell className="font-medium">
                <Link
                  href={bookingStatusesRoute()}
                  className="inline-flex items-center gap-2 hover:underline"
                >
                  <ColorSwatch color={status.color} />
                  {status.name}
                </Link>
              </TableCell>
              <TableCell>{phases(status.phase)}</TableCell>
              <TableCell>{t("transitions", { count: status.transitionsTo.length })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
