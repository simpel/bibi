import type { SeriesOccurrenceDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getFormatter, getTranslations } from "next-intl/server";
import { bookingRoute } from "@/lib/routes";
import { BookingStatusLabel } from "../../booking/ui/booking-status-label";
import type { SeriesFormData } from "./series-form-data";

const PERIOD = { dateStyle: "medium", timeStyle: "short" } as const;

export type OccurrenceTableProps = { occurrences: SeriesOccurrenceDto[]; data: SeriesFormData };

/** The series' occurrences: number, booking (link), time, status and a clash marker. */
export async function OccurrenceTable({ occurrences, data }: OccurrenceTableProps) {
  const t = await getTranslations("bookingSeries");
  const booking = await getTranslations("booking");
  const format = await getFormatter();
  const total = occurrences.length;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.occurrence")}</TableHead>
          <TableHead>{t("columns.booking")}</TableHead>
          <TableHead>{t("columns.when")}</TableHead>
          <TableHead>{t("columns.status")}</TableHead>
          <TableHead>{t("columns.clash")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {occurrences.map((occurrence) => (
          <TableRow key={occurrence.bookingId}>
            <TableCell>{t("occurrence", { index: occurrence.occurrenceIndex, total })}</TableCell>
            <TableCell className="font-medium">
              <Link href={bookingRoute({ id: occurrence.bookingId })} className="hover:underline">
                {booking("reference", { reference: occurrence.reference })}
              </Link>
            </TableCell>
            <TableCell>
              {format.dateTimeRange(occurrence.startsAt, occurrence.endsAt, PERIOD)}
            </TableCell>
            <TableCell>
              <BookingStatusLabel statuses={data.statuses} id={occurrence.bookingStatusId} />
            </TableCell>
            <TableCell>
              {occurrence.clash ? <Badge variant="warning">{t("clash")}</Badge> : "–"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
