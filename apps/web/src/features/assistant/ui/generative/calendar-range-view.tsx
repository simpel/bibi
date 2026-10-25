"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { CalendarRangeBlock } from "./calendar-range-block";
import { groupBlocksByDay } from "./calendar-range-model";
import type { GenerativeProps } from "./generative-props";

export type CalendarRangeViewProps = GenerativeProps<"calendar-range">;

const MAX_BLOCKS = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The calendar for a period as blocks per day; the full calendar is on `/calendar`. */
export function CalendarRangeView({ range }: CalendarRangeViewProps) {
  const t = useTranslations("assistant.ui.calendar");
  const format = useDateTimeFormat();
  const { timeZone } = range;
  // `to` is exclusive (the start of the day after the last).
  const end = new Date(new Date(range.to).getTime() - DAY_MS);
  const period = format.dateRange({ start: range.from, end, timeZone });
  const { days, hidden } = groupBlocksByDay({ blocks: range.blocks, timeZone, limit: MAX_BLOCKS });
  return (
    <Card data-slot="calendar-range" className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{t("title", { period })}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 pt-0 text-sm">
        {days.length === 0 ? <p className="text-muted-foreground">{t("empty")}</p> : null}
        {days.map((group) => (
          <section key={group.key} className="grid gap-1">
            <h4 className="text-xs font-medium text-muted-foreground">
              {format.date({ instant: group.firstStart, timeZone })}
            </h4>
            <ul className="grid gap-1">
              {group.blocks.map((block) => (
                <CalendarRangeBlock key={block.id} block={block} timeZone={timeZone} />
              ))}
            </ul>
          </section>
        ))}
        {hidden > 0 ? (
          <p className="text-muted-foreground">{t("more", { count: hidden })}</p>
        ) : null}
        <Link href={ROUTES.calendar} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
