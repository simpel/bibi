import type { PlainDate } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { type CalendarParams, calendarHref } from "../calendar-params";
import {
  anchorOf,
  CALENDAR_VIEWS,
  periodFor,
  shiftPeriod,
  todayPeriod,
  viewOf,
} from "../calendar-period";
import type { CalendarData } from "../load-calendar";
import { CalendarFilters } from "./calendar-filters";
import { ViewSwitch } from "./view-switch";

export type CalendarToolbarProps = {
  params: CalendarParams;
  /** Today in the calendar's time zone, for the "Today" link. */
  today: PlainDate;
  /** The shown period, e.g. "12–18 Oct 2026". */
  period: string;
  data: CalendarData;
};

const href = ({ params }: { params: CalendarParams }) => calendarHref({ params });

/** Each view's link: its period around the shown anchor day, with the filters kept. */
async function viewLinks({ params, today }: Pick<CalendarToolbarProps, "params" | "today">) {
  const t = await getTranslations("calendar");
  const anchor = anchorOf({ period: params.period, today });
  return CALENDAR_VIEWS.map((view) => ({
    view,
    label: t(`views.${view}`),
    href: href({ params: { ...params, period: periodFor({ view, anchor }) } }),
  }));
}

type PeriodNavProps = Pick<CalendarToolbarProps, "params" | "today">;

/** Previous / today / next, each keeping the view and the filters. */
async function PeriodNav({ params, today }: PeriodNavProps) {
  const t = await getTranslations("calendar");
  const at = ({ shown }: { shown: CalendarParams["period"] }) =>
    href({ params: { ...params, period: shown } });
  return (
    <>
      <Button asChild variant="outline" size="icon">
        <Link
          href={at({ shown: shiftPeriod({ period: params.period, step: -1 }) })}
          aria-label={t("previous")}
        >
          <ChevronLeftIcon />
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href={at({ shown: todayPeriod({ period: params.period, today }) })}>
          {t("today")}
        </Link>
      </Button>
      <Button asChild variant="outline" size="icon">
        <Link
          href={at({ shown: shiftPeriod({ period: params.period, step: 1 }) })}
          aria-label={t("next")}
        >
          <ChevronRightIcon />
        </Link>
      </Button>
    </>
  );
}

/** Previous / today / next, the shown period, the view and the filters. */
export async function CalendarToolbar({ params, today, period, data }: CalendarToolbarProps) {
  const t = await getTranslations("calendar");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <PeriodNav params={params} today={today} />
      <h2 className="min-w-0 flex-1 text-base font-medium">{period}</h2>
      <ViewSwitch
        label={t("view")}
        current={viewOf({ period: params.period })}
        links={await viewLinks({ params, today })}
      />
      <CalendarFilters
        params={params}
        venues={data.venues}
        types={data.types}
        typeId={data.typeId}
        states={data.legend}
        statuses={data.statuses}
        tickets={data.tickets}
      />
    </div>
  );
}
