import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { BookingList } from "@/features/booking/ui/booking-list";
import { readCursor } from "@/lib/page-cursor";

type BookingsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function BookingsPage({ params, searchParams }: BookingsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return <BookingList locale={locale} cursor={readCursor({ value: cursor })} />;
}
