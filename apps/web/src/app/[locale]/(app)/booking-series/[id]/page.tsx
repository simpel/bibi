import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { BookingSeriesDetail } from "@/features/booking-series/ui/booking-series-detail";

type BookingSeriesDetailPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function BookingSeriesDetailPage({ params }: BookingSeriesDetailPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <BookingSeriesDetail locale={locale} id={id} />;
}
