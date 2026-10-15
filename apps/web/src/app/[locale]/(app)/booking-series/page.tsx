import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { BookingSeriesList } from "@/features/booking-series/ui/booking-series-list";
import { readCursor } from "@/lib/page-cursor";

type BookingSeriesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function BookingSeriesPage({ params, searchParams }: BookingSeriesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return <BookingSeriesList locale={locale} cursor={readCursor({ value: cursor })} />;
}
