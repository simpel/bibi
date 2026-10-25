import { resolveLocale } from "@bibi/i18n";
import { calendarHref, calendarToday } from "@/features/calendar/calendar-path";
import { redirect } from "@/lib/navigation";

type CalendarStartProps = { params: Promise<{ locale: string; org: string }> };

/** Bare `/calendar`: today, in the organization's zone. */
export default async function CalendarStart({ params }: CalendarStartProps) {
  const { locale, org } = await params;
  const today = await calendarToday();
  redirect({
    href: calendarHref({ from: today, to: today }),
    locale: resolveLocale({ value: locale }),
    org,
  });
}
