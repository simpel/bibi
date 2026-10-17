import { DEFAULT_TIME_ZONE, type Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { calendarRange, type RawCalendarParams, readCalendarParams } from "../calendar-params";
import { loadCalendar } from "../load-calendar";
import { CalendarBody } from "./calendar-body";
import { CalendarToolbar } from "./calendar-toolbar";

export type CalendarPageProps = { locale: Locale; raw: RawCalendarParams };

const TIME_ZONE = DEFAULT_TIME_ZONE;

/** No bookable item yet: point to the items page, where a bookable type's items are created. */
async function NoSpaces({ header }: { header: ReactNode }) {
  const t = await getTranslations("calendar");
  const action = (
    <Button asChild variant="outline">
      <Link href={ROUTES.items}>{t("goToItems")}</Link>
    </Button>
  );
  return (
    <div className="grid gap-6">
      {header}
      <EmptyState title={t("noSpaces")} description={t("noSpacesDescription")} action={action} />
    </div>
  );
}

/** `/calendar`: header, toolbar and the occupancy of every space for the shown day or week. */
export async function CalendarPage({ locale, raw }: CalendarPageProps) {
  const t = await getTranslations("calendar");
  const format = await getFormatter();
  const now = new Date();
  const params = readCalendarParams({ raw, now, timeZone: TIME_ZONE });
  const today = readCalendarParams({ raw: {}, now, timeZone: TIME_ZONE }).date;
  const range = calendarRange({ params, timeZone: TIME_ZONE });
  const [result, { bookingWrite }] = await Promise.all([
    loadCalendar({ ...range, venueId: params.venueId, typeId: params.typeId }),
    getCallerAbilities(),
  ]);
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const last = new Date(range.to.getTime() - 1);
  const period = format.dateTimeRange(range.from, last, {
    dateStyle: "medium",
    timeZone: TIME_ZONE,
  });
  const header = <PageHeader title={t("title")} description={t("description")} />;
  if (result.value.spaces.length === 0 && !params.venueId) return <NoSpaces header={header} />;
  return (
    <div className="grid gap-6">
      {header}
      <CalendarToolbar
        params={params}
        today={today}
        period={period}
        venues={result.value.venues}
        types={result.value.types}
        typeId={result.value.typeId}
      />
      <CalendarBody
        params={params}
        data={result.value}
        timeZone={TIME_ZONE}
        canBook={bookingWrite}
      />
    </div>
  );
}
