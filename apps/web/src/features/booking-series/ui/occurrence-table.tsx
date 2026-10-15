import type { BookingSeriesDto, SeriesOccurrenceDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getFormatter, getTranslations } from "next-intl/server";
import { bookingRoute } from "@/lib/routes";
import { BookingStatusLabel } from "../../booking/ui/booking-status-label";
import { EditOccurrenceButton } from "./edit-occurrence-button";
import type { SeriesFormData } from "./series-form-data";

const PERIOD = { dateStyle: "medium", timeStyle: "short" } as const;

export type OccurrenceTableProps = { series: BookingSeriesDto; data: SeriesFormData };

type OccurrenceRowProps = OccurrenceTableProps & { occurrence: SeriesOccurrenceDto };

/** A running series' occurrence that is not cancelled or completed can still be changed. */
const editable = ({ series, data, occurrence }: OccurrenceRowProps) => {
  const status = data.statuses.find(({ id }) => id === occurrence.bookingStatusId);
  return !series.cancelledAt && !["CANCELLED", "COMPLETED"].includes(status?.phase ?? "");
};

/** One occurrence: number, booking (link), time, status, a clash marker and a change. */
async function OccurrenceRow({ series, data, occurrence }: OccurrenceRowProps) {
  const t = await getTranslations("bookingSeries");
  const booking = await getTranslations("booking");
  const format = await getFormatter();
  const total = series.occurrences.length;
  return (
    <TableRow>
      <TableCell>{t("occurrence", { index: occurrence.occurrenceIndex, total })}</TableCell>
      <TableCell className="font-medium">
        <Link href={bookingRoute({ id: occurrence.bookingId })} className="hover:underline">
          {booking("reference", { reference: occurrence.reference })}
        </Link>
      </TableCell>
      <TableCell>{format.dateTimeRange(occurrence.startsAt, occurrence.endsAt, PERIOD)}</TableCell>
      <TableCell>
        <BookingStatusLabel statuses={data.statuses} id={occurrence.bookingStatusId} />
      </TableCell>
      <TableCell>
        {occurrence.clash ? <Badge variant="warning">{t("clash")}</Badge> : "–"}
      </TableCell>
      <TableCell>
        {editable({ series, data, occurrence }) ? (
          <EditOccurrenceButton
            seriesId={series.id}
            occurrence={occurrence}
            total={total}
            rooms={data.rooms}
          />
        ) : null}
      </TableCell>
    </TableRow>
  );
}

/** The series' occurrences in order, each changeable while it is still open. */
export async function OccurrenceTable({ series, data }: OccurrenceTableProps) {
  const t = await getTranslations("bookingSeries");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.occurrence")}</TableHead>
          <TableHead>{t("columns.booking")}</TableHead>
          <TableHead>{t("columns.when")}</TableHead>
          <TableHead>{t("columns.status")}</TableHead>
          <TableHead>{t("columns.clash")}</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">{t("columns.actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {series.occurrences.map((occurrence) => (
          <OccurrenceRow
            key={occurrence.bookingId}
            series={series}
            data={data}
            occurrence={occurrence}
          />
        ))}
      </TableBody>
    </Table>
  );
}
