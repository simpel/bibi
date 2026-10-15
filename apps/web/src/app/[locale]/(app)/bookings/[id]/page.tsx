import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { BookingDetail } from "@/features/booking/ui/booking-detail";

type BookingPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function BookingPage({ params }: BookingPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <BookingDetail locale={locale} id={id} />;
}
