"use client";

import type { BookingDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { bookingRoute } from "@/lib/routes";
import { BookingForm } from "./booking-form";
import type { BookingFormData } from "./booking-form-data";

export type BookingUpdateFormProps = { booking: BookingDto; data: BookingFormData };

/** The booking form on its update page; saving (or cancelling) goes back to the booking. */
export function BookingUpdateForm({ booking, data }: BookingUpdateFormProps) {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <BookingForm
        data={data}
        booking={booking}
        onDone={() => router.push(bookingRoute({ id: booking.id }))}
      />
    </div>
  );
}
