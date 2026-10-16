import type { BookingDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getFormatter, getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import { bookingRoute } from "@/lib/routes";
import { SeriesMarker } from "../../booking-series/ui/series-marker";
import type { BookingFormData } from "./booking-form-data";
import { BookingStatusLabel } from "./booking-status-label";

const PERIOD = { dateStyle: "medium", timeStyle: "short" } as const;

export type BookingTableProps = {
  bookings: BookingDto[];
  data: BookingFormData;
  seriesTotals: Map<string, number>;
};

type ReferenceCellProps = { booking: BookingDto; reference: string; total: number | undefined };

/** The reference link with the series marker beside it. */
function ReferenceCell({ booking, reference, total }: ReferenceCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Link href={bookingRoute({ id: booking.id })} className="hover:underline">
        {reference}
      </Link>
      <SeriesMarker seriesId={booking.seriesId} index={booking.occurrenceIndex} total={total} />
    </div>
  );
}

/** Booking rows: reference (link), customer, type, time, status and salesperson. */
export async function BookingTable({ bookings, data, seriesTotals }: BookingTableProps) {
  const t = await getTranslations("booking");
  const format = await getFormatter();
  const types = data.types.map(({ id, name }) => ({ id, name }));
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.reference")}</TableHead>
          <TableHead>{t("columns.customer")}</TableHead>
          <TableHead>{t("columns.type")}</TableHead>
          <TableHead>{t("columns.when")}</TableHead>
          <TableHead>{t("columns.status")}</TableHead>
          <TableHead>{t("columns.salesOwner")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-medium">
              <ReferenceCell
                booking={booking}
                reference={t("reference", { reference: booking.reference })}
                total={booking.seriesId ? seriesTotals.get(booking.seriesId) : undefined}
              />
            </TableCell>
            <TableCell>{nameOf({ options: data.customers, id: booking.customerId })}</TableCell>
            <TableCell>{nameOf({ options: types, id: booking.entityTypeId })}</TableCell>
            <TableCell>{format.dateTimeRange(booking.startsAt, booking.endsAt, PERIOD)}</TableCell>
            <TableCell>
              <BookingStatusLabel statuses={data.statuses} id={booking.bookingStatusId} />
            </TableCell>
            <TableCell>{nameOf({ options: data.members, id: booking.salesOwnerId })}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
