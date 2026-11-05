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
import { loadOpeningHours } from "../load-opening-hours";
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
  // The bookings stream onto the painted grid (ADR 0097): they are the slowest read.
  const load = loadBookings({ range })
    .then((result) => (result.ok ? result.value : null))
    .catch(() => null);
  const [assets, today, openingHours] = await Promise.all([
    loadCalendarAssets(),
    calendarToday(),
    loadOpeningHours(),
  ]);
  if (!assets.ok) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState errorKey={handleLoadError({ error: assets.error, locale })} />
      </div>
    );
  }
  if (assets.value.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <NoAssets />
      </div>
    );
  }
  return <CalendarView {...{ range, today, openingHours }} assets={assets.value} load={load} />;
}
