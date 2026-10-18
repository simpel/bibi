import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { BookingUpdate } from "@/features/booking/ui/booking-update";

type UpdateBookingPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateBookingPage({ params }: UpdateBookingPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <BookingUpdate locale={locale} id={id} />;
}
