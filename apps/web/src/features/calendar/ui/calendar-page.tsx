import { DEFAULT_TIME_ZONE, type Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ComponentProps, ReactNode } from "react";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { calendarRange, type RawCalendarParams, readCalendarParams } from "../calendar-params";
import { loadCalendar } from "../load-calendar";
import { CalendarBody } from "./calendar-body";
import { CalendarLegend } from "./calendar-legend";
import { CalendarToolbar } from "./calendar-toolbar";

export type CalendarPageProps = { locale: Locale; raw: RawCalendarParams };

const TIME_ZONE = DEFAULT_TIME_ZONE;

/** The URL filters the loader narrows by. */
const filtersOf = ({ params }: { params: ReturnType<typeof readCalendarParams> }) => ({
  venueId: params.venueId,
  typeId: params.typeId,
  stateId: params.stateId,
  phaseId: params.phaseId,
  ticketId: params.ticketId,
});

/** No bookable item yet: point to the items page, where a bookable type's items are created. */
async function NoSpaces({ header }: { header: ReactNode }) {
  const t = await getTranslations("calendar");
  const action = (
    <Button asChild variant="outline">
      <Link href={ROUTES.items}>{t("goToItems")}</Link>
    </Button>
  );
  return (
    <div className="grid gap-6 overflow-auto p-4 sm:p-6">
      {header}
      <EmptyState title={t("noSpaces")} description={t("noSpacesDescription")} action={action} />
    </div>
  );
}

type CalendarLayoutProps = { header: ReactNode; toolbar: ReactNode; children: ReactNode };

/** Full-width toolbar row; the body scrolls on its own below it. */
function CalendarLayout({ header, toolbar, children }: CalendarLayoutProps) {
  return (
    <>
      <div className="grid shrink-0 gap-4 p-4 pb-3 sm:px-6 sm:pt-6">
        {header}
        {toolbar}
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 sm:px-6 sm:pb-6">{children}</div>
    </>
  );
}

type LoadErrorProps = { errorKey: ComponentProps<typeof ErrorState>["errorKey"] };

function LoadError({ errorKey }: LoadErrorProps) {
  return (
    <div className="p-4 sm:p-6">
      <ErrorState errorKey={errorKey} />
    </div>
  );
}

type FormatPeriodInput = {
  format: Awaited<ReturnType<typeof getFormatter>>;
  range: ReturnType<typeof calendarRange>;
};

const formatPeriod = ({ format, range }: FormatPeriodInput): string =>
  format.dateTimeRange(range.from, new Date(range.to.getTime() - 1), {
    dateStyle: "medium",
    timeZone: TIME_ZONE,
  });

/**
 * `/calendar` (a canvas page, ADR 0038): a full-width toolbar row and the occupancy of every space
 * for the shown day or week, which scrolls on its own below it.
 */
export async function CalendarPage({ locale, raw }: CalendarPageProps) {
  const t = await getTranslations("calendar");
  const format = await getFormatter();
  const now = new Date();
  const params = readCalendarParams({ raw, now, timeZone: TIME_ZONE });
  const today = readCalendarParams({ raw: {}, now, timeZone: TIME_ZONE }).date;
  const range = calendarRange({ params, timeZone: TIME_ZONE });
  const [result, abilities] = await Promise.all([
    loadCalendar({ ...range, ...filtersOf({ params }) }),
    getCallerAbilities(),
  ]);
  if (!result.ok) return <LoadError errorKey={handleLoadError({ error: result.error, locale })} />;
  const period = formatPeriod({ format, range });
  const header = <PageHeader title={t("title")} description={t("description")} />;
  if (result.value.spaces.length === 0 && !params.venueId) return <NoSpaces header={header} />;
  return (
    <CalendarLayout
      header={header}
      toolbar={
        <CalendarToolbar params={params} today={today} period={period} data={result.value} />
      }
    >
      <div className="mb-3">
        <CalendarLegend states={result.value.legend} />
      </div>
      <CalendarBody
        params={params}
        data={result.value}
        timeZone={TIME_ZONE}
        canBook={can({ abilities, permission: "ticket:write" })}
      />
    </CalendarLayout>
  );
}
