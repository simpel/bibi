import type { DateTimeFormat } from "@bibi/core/schemas";
import type { Locale } from "@bibi/i18n";
import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import type { ComponentProps, ReactNode } from "react";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import {
  type CalendarParams,
  calendarRange,
  type RawCalendarParams,
  readCalendarFilters,
} from "../calendar-params";
import { readCalendarPeriod } from "../calendar-period";
import { calendarTimeZone, todayIn } from "../calendar-routing";
import { loadCalendar } from "../load-calendar";
import { CalendarBody } from "./calendar-body";
import { CalendarLegend } from "./calendar-legend";
import { CalendarToolbar } from "./calendar-toolbar";

export type CalendarPageProps = {
  locale: Locale;
  /** The path's `{from}` and `{to}`, already canonical (the route redirects otherwise). */
  from: string;
  to: string;
  raw: RawCalendarParams;
};

/** The URL filters the loader narrows by. */
const filtersOf = ({ params }: { params: CalendarParams }) => ({
  venueId: params.venueId,
  typeId: params.typeId,
  stateId: params.stateId,
  statusId: params.statusId,
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
  format: DateTimeFormat;
  range: ReturnType<typeof calendarRange>;
};

const formatPeriod = ({ format, range, timeZone }: FormatPeriodInput & { timeZone: string }) =>
  format.dateRange({ start: range.from, end: new Date(range.to.getTime() - 1), timeZone });

/**
 * `/calendar` (a canvas page, ADR 0038): a full-width toolbar row and the occupancy of every space
 * for the shown period (`/calendar/{from}/{to}`, ADR 0064), which scrolls on its own below it. One venue shows in its zone, all
 * venues in the organization's (ADR 0064 decision 12).
 */
export async function CalendarPage({ locale, from, to, raw }: CalendarPageProps) {
  const t = await getTranslations("calendar");
  const format = await getDateTimeFormat();
  const filters = readCalendarFilters({ raw });
  const timeZone = await calendarTimeZone({ venueId: filters.venueId });
  const today = todayIn({ timeZone });
  const params = { ...filters, period: readCalendarPeriod({ from, to, today }) };
  const range = calendarRange({ period: params.period, timeZone });
  const [result, abilities] = await Promise.all([
    loadCalendar({ period: params.period, ...filtersOf({ params }) }),
    getCallerAbilities(),
  ]);
  if (!result.ok) return <LoadError errorKey={handleLoadError({ error: result.error, locale })} />;
  const period = formatPeriod({ format, range, timeZone });
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
        timeZone={timeZone}
        canBook={can({ abilities, permission: "ticket:write" })}
      />
    </CalendarLayout>
  );
}
