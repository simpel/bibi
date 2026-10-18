import { getBooking } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { bookingRoute } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadBookingData } from "../load-booking-data";
import { BookingUpdateForm } from "./booking-update-form";

export type BookingUpdateProps = { locale: Locale; id: string };

/** `/bookings/[id]/update`: edit the booking on a page of its own. */
export async function BookingUpdate({ locale, id }: BookingUpdateProps) {
  const t = await getTranslations("booking");
  if (!(await getCallerAbilities()).bookingWrite) notFound();
  const [booking, data] = await Promise.all([
    runOperation({ operation: getBooking, input: { id } }),
    loadBookingData(),
  ]);
  if (!booking.ok)
    return <ErrorState errorKey={handleLoadError({ error: booking.error, locale })} />;
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell
      backHref={bookingRoute({ id })}
      title={t("edit")}
      description={t("editDescription")}
    >
      <BookingUpdateForm booking={booking.value} data={data.value} />
    </FormPageShell>
  );
}
