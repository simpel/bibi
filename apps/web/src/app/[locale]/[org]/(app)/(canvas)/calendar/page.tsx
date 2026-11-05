import { resolveLocale } from "@bibi/i18n";
import { calendarHref, calendarToday } from "@/features/calendar/calendar-path";
import { redirect } from "@/lib/navigation";
import { pageTitle } from "@/lib/page-metadata";

type CalendarStartProps = { params: Promise<{ locale: string; org: string }> };

export async function generateMetadata({ params }: CalendarStartProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "calendar" });
}

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
