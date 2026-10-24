import { resolveLocale } from "@bibi/i18n";
import type { RawCalendarParams } from "@/features/calendar/calendar-params";
import { calendarStartHref } from "@/features/calendar/calendar-routing";
import { redirect } from "@/lib/navigation";

type CalendarStartProps = {
  params: Promise<{ locale: string; org: string }>;
  searchParams: Promise<RawCalendarParams>;
};

/** Bare `/calendar` (and old `?view=&date=` links): redirects to a `/calendar/{from}/{to}` period. */
export default async function CalendarStart({ params, searchParams }: CalendarStartProps) {
  const { locale, org } = await params;
  const href = await calendarStartHref({ raw: await searchParams });
  redirect({ href, locale: resolveLocale({ value: locale }), org });
}
