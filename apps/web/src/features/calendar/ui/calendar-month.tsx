import { addDays, type PlainDate, toIsoDate } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { getDateTimeFormat } from "@/server/date-time-format";
import type { MonthBlank, MonthCell } from "../calendar-month-model";
import type { CalendarFilters } from "../calendar-params";
import { calendarHref } from "../calendar-params";
import { markerStyle } from "./calendar-list";

/** Blocks shown per day before "+N more". */
const SHOWN = 3;

export type CalendarMonthProps = { weeks: (MonthCell | MonthBlank)[][]; filters: CalendarFilters };

const noon = ({ date }: { date: PlainDate }) => new Date(`${toIsoDate({ date })}T12:00:00Z`);

type DayProps = { cell: MonthCell; filters: CalendarFilters };

async function MonthDay({ cell: { date, day }, filters }: DayProps) {
  const t = await getTranslations("calendar");
  const href = calendarHref({ params: { ...filters, period: { from: date, to: date } } });
  const rest = day.entries.length - SHOWN;
  return (
    <div className="grid min-h-28 content-start gap-1 border-r border-b p-1 text-xs">
      <Link
        href={href}
        aria-label={t("openDay", { date: day.label })}
        className="font-medium hover:underline"
      >
        {date.day}
      </Link>
      {day.entries.slice(0, SHOWN).map((entry) => (
        <div
          key={entry.id}
          className="truncate rounded-sm border px-1"
          style={markerStyle({ entry })}
        >
          {entry.href ? (
            <Link href={entry.href} className="hover:underline">
              {entry.time} {entry.label}
            </Link>
          ) : (
            `${entry.time} ${entry.label}`
          )}
        </div>
      ))}
      {rest > 0 ? (
        <span className="text-muted-foreground">{t("more", { count: rest })}</span>
      ) : null}
    </div>
  );
}

/** A month as weeks of days (not a table: the grid is the one exception), each day's first blocks. */
export async function CalendarMonth({ weeks, filters }: CalendarMonthProps) {
  const format = await getDateTimeFormat();
  const second = weeks[1]?.[0];
  const monday = second && "date" in second ? second.date : undefined;
  const weekdays = monday
    ? Array.from({ length: 7 }, (_, days) =>
        format.weekday({
          instant: noon({ date: addDays({ date: monday, days }) }),
          style: "short",
          timeZone: "UTC",
        }),
      )
    : [];
  return (
    <div className="hidden rounded-md border-t border-l md:grid md:grid-cols-7">
      {weekdays.map((name) => (
        <div key={name} className="border-r border-b p-1 text-xs font-medium text-muted-foreground">
          {name}
        </div>
      ))}
      {weeks
        .flat()
        .map((cell) =>
          "blank" in cell ? (
            <div key={cell.blank} className="border-r border-b bg-muted/40" />
          ) : (
            <MonthDay key={cell.day.key} cell={cell} filters={filters} />
          ),
        )}
    </div>
  );
}
