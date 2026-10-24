import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { RawCalendarParams } from "@/features/calendar/calendar-params";
import { canonicalCalendarHref } from "@/features/calendar/calendar-routing";
import { CalendarPage } from "@/features/calendar/ui/calendar-page";
import { redirect } from "@/lib/navigation";

type CalendarRouteProps = {
  params: Promise<{ locale: string; org: string; from: string; to: string }>;
  searchParams: Promise<RawCalendarParams>;
};

/** Occupancy per space for `{from}` to `{to}`, inclusive; the view follows the range (ADR 0064). */
export default async function CalendarRoute({ params, searchParams }: CalendarRouteProps) {
  const { org, from, to, ...rest } = await params;
  const locale = resolveLocale({ value: rest.locale });
  setRequestLocale(locale);
  const raw = await searchParams;
  const canonical = await canonicalCalendarHref({ from, to, raw });
  if (canonical) redirect({ href: canonical, locale, org });
  return <CalendarPage locale={locale} from={from} to={to} raw={raw} />;
}
