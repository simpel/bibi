import { getBooking } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadBookingData } from "../load-booking-data";
import { BookingActions } from "./booking-actions";
import { BookingFacts } from "./booking-facts";

export type BookingDetailProps = { locale: Locale; id: string };

/** Booking detail page body: facts with edit and change owners. */
export async function BookingDetail({ locale, id }: BookingDetailProps) {
  const common = await getTranslations("common");
  const t = await getTranslations("booking");
  const { bookingWrite } = await getCallerAbilities();
  const [booking, data] = await Promise.all([
    runOperation({ operation: getBooking, input: { id } }),
    loadBookingData(),
  ]);
  if (!booking.ok) {
    return <ErrorState errorKey={handleLoadError({ error: booking.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const actions = bookingWrite ? (
    <BookingActions booking={booking.value} data={data.value} />
  ) : undefined;
  return (
    <div className="grid gap-6">
      <Link
        href={ROUTES.bookings}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {common("back")}
      </Link>
      <PageHeader
        title={t("reference", { reference: booking.value.reference })}
        actions={actions}
      />
      <BookingFacts booking={booking.value} data={data.value} />
    </div>
  );
}
