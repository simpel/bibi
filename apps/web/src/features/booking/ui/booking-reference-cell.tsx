import type { BookingDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { bookingRoute } from "@/lib/routes";
import { SeriesMarker } from "../../booking-series/ui/series-marker";

export type BookingReferenceCellProps = {
  booking: BookingDto;
  reference: string;
  total: number | undefined;
};

/** The reference link with the series marker beside it. */
export function BookingReferenceCell({ booking, reference, total }: BookingReferenceCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Link href={bookingRoute({ id: booking.id })} className="font-medium hover:underline">
        {reference}
      </Link>
      <SeriesMarker seriesId={booking.seriesId} index={booking.occurrenceIndex} total={total} />
    </div>
  );
}
