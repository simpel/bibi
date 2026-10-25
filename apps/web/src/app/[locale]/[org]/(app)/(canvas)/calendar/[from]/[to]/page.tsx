import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { canonicalCalendarHref } from "@/features/calendar/calendar-path";
import { CalendarPage } from "@/features/calendar/ui/calendar-page";
import { redirect } from "@/lib/navigation";

type CalendarRouteProps = {
  params: Promise<{ locale: string; org: string; from: string; to: string }>;
};

/** Every bookable item from `{from}` to `{to}`, inclusive, on one endless timeline (ADR 0064). */
export default async function CalendarRoute({ params }: CalendarRouteProps) {
  const { org, from, to, ...rest } = await params;
  const locale = resolveLocale({ value: rest.locale });
  setRequestLocale(locale);
  const canonical = await canonicalCalendarHref({ from, to });
  if (canonical) redirect({ href: canonical, locale, org });
  return <CalendarPage locale={locale} from={from} to={to} />;
}
