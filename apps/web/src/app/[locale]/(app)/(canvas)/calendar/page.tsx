import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { RawCalendarParams } from "@/features/calendar/calendar-params";
import { CalendarPage } from "@/features/calendar/ui/calendar-page";

type CalendarRouteProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawCalendarParams>;
};

/** Occupancy per space by day or week; `?view`, `?date` and `?venue` make the view shareable. */
export default async function CalendarRoute({ params, searchParams }: CalendarRouteProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <CalendarPage locale={locale} raw={await searchParams} />;
}
