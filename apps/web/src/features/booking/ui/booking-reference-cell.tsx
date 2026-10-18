import type { BookingDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { bookingRoute } from "@/lib/routes";

export type BookingReferenceCellProps = {
  booking: BookingDto;
  reference: string;
};

/** The reference as a link to the booking. */
export function BookingReferenceCell({ booking, reference }: BookingReferenceCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Link href={bookingRoute({ id: booking.id })} className="font-medium hover:underline">
        {reference}
      </Link>
    </div>
  );
}
