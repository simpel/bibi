import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { BookingStatusList } from "@/features/booking-status/ui/booking-status-list";

type BookingStatusesPageProps = { params: Promise<{ locale: string }> };

export default async function BookingStatusesPage({ params }: BookingStatusesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <BookingStatusList locale={locale} />;
}
