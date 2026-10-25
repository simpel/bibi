import type { Locale } from "@bibi/i18n";
import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { calendarToday } from "../calendar-path";
import { loadBookings } from "../load-bookings";
import { loadCalendarAssets } from "../load-calendar";
import { CalendarView } from "./calendar-view";

export type CalendarPageProps = {
  locale: Locale;
  /** The path's `{from}` and `{to}`, already canonical (the route redirects otherwise). */
  from: string;
  to: string;
};

/** No bookable item yet: point to the items page, where a bookable type's items are created. */
async function NoAssets() {
  const t = await getTranslations("calendar");
  const action = (
    <Button asChild variant="outline">
      <Link href={ROUTES.items}>{t("goToItems")}</Link>
    </Button>
  );
  return (
    <EmptyState title={t("noSpaces")} description={t("noSpacesDescription")} action={action} />
  );
}

/**
 * `/calendar/{from}/{to}` (a canvas page, ADR 0038): every bookable item on one endless timeline
 * across the whole canvas, opening on the path's days; the breadcrumb names the page. The path follows the days on screen (ADR 0064).
 */
export async function CalendarPage({ locale, from, to }: CalendarPageProps) {
  const range = { from, to };
  const [assets, bookings, today] = await Promise.all([
    loadCalendarAssets(),
    loadBookings({ range }),
    calendarToday(),
  ]);
  const failed = !assets.ok ? assets : !bookings.ok ? bookings : null;
  if (failed) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState errorKey={handleLoadError({ error: failed.error, locale })} />
      </div>
    );
  }
  if (!assets.ok || !bookings.ok) return null;
  if (assets.value.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <NoAssets />
      </div>
    );
  }
  return (
    <CalendarView assets={assets.value} bookings={bookings.value} range={range} today={today} />
  );
}
