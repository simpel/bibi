import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { BookingCreate } from "@/features/booking/ui/booking-create";

type NewBookingPageProps = { params: Promise<{ locale: string }> };

export default async function NewBookingPage({ params }: NewBookingPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <BookingCreate locale={locale} />;
}
