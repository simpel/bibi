import { isIsoDate } from "@bibi/core/schemas";
import { resolveLocale } from "@bibi/i18n";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { DayScreen } from "@/features/reservation/ui/day-screen";
import { pageTitle } from "@/lib/page-metadata";

type PageProps = {
  params: Promise<{ locale: string; date: string }>;
  searchParams: Promise<{ room?: string; create?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "reservations" });
}

/** The waiter's workspace, full width (ADR 0038): floor and list in one view. */
export default async function ReservationDayPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale, date } = await params;
  if (!isIsoDate({ value: date })) notFound();
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  const { room, create } = await searchParams;
  return <DayScreen locale={locale} date={date} room={room} createOpen={create === "1"} />;
}
