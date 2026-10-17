import { Link } from "@okazi/i18n/navigation";
import { Button, cn } from "@okazi/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/routes";
import {
  CALENDAR_VIEWS,
  type CalendarParams,
  calendarQuery,
  shiftCalendar,
} from "../calendar-params";
import { VenueFilter } from "./venue-filter";

export type CalendarToolbarProps = {
  params: CalendarParams;
  /** Today in the app's time zone, for the "Today" link. */
  today: CalendarParams["date"];
  /** The shown period, e.g. "Mon 12 Oct – Sun 18 Oct". */
  period: string;
  venues: { id: string; name: string }[];
};

const href = ({ params }: { params: CalendarParams }) => ({
  pathname: ROUTES.calendar,
  query: calendarQuery({ params }),
});

type ViewSwitchProps = { params: CalendarParams; label: string };

/** Day or week, as links that keep the date and venue. */
async function ViewSwitch({ params, label }: ViewSwitchProps) {
  const t = await getTranslations("calendar");
  return (
    <nav aria-label={label} className="flex rounded-md border p-0.5">
      {CALENDAR_VIEWS.map((view) => (
        <Link
          key={view}
          href={href({ params: { ...params, view } })}
          aria-current={view === params.view ? "page" : undefined}
          className={cn(
            "rounded-sm px-3 py-1 text-sm",
            view === params.view ? "bg-muted font-medium" : "text-muted-foreground",
          )}
        >
          {t(`views.${view}`)}
        </Link>
      ))}
    </nav>
  );
}

/** Previous / today / next, the shown period, day or week, and the venue filter. All links. */
export async function CalendarToolbar({ params, today, period, venues }: CalendarToolbarProps) {
  const t = await getTranslations("calendar");
  const { venueId: _venue, ...withoutVenue } = params;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="icon">
        <Link
          href={href({ params: shiftCalendar({ params, step: -1 }) })}
          aria-label={t("previous")}
        >
          <ChevronLeftIcon />
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href={href({ params: { ...params, date: today } })}>{t("today")}</Link>
      </Button>
      <Button asChild variant="outline" size="icon">
        <Link href={href({ params: shiftCalendar({ params, step: 1 }) })} aria-label={t("next")}>
          <ChevronRightIcon />
        </Link>
      </Button>
      <h2 className="min-w-0 flex-1 text-base font-medium">{period}</h2>
      <ViewSwitch params={params} label={t("view")} />
      {venues.length > 1 ? (
        <VenueFilter
          venues={venues}
          venueId={params.venueId}
          query={calendarQuery({ params: withoutVenue })}
        />
      ) : null}
    </div>
  );
}
