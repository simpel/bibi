import { addDays, parseIsoDate, toIsoDate } from "@bibi/core/schemas";
import { ROUTES } from "@/lib/routes";

export type MyWorkPeriodKey = "today" | "tomorrow" | "week";

export type MyWorkPeriod = { key: MyWorkPeriodKey; from: string; to: string; href: string };

/** `/` for today alone, else `/my-work/{from}/{to}` (inclusive days, ADR 0064). */
export function myWorkHref({ from, to, today }: { from: string; to: string; today: string }) {
  return from === today && to === today ? ROUTES.home : `${ROUTES.myWork}/${from}/${to}`;
}

/** Today, tomorrow and the seven days from today, each with its link. */
export function myWorkPeriods({ today }: { today: string }): MyWorkPeriod[] {
  const day = parseIsoDate({ value: today });
  const tomorrow = toIsoDate({ date: addDays({ date: day, days: 1 }) });
  const weekEnd = toIsoDate({ date: addDays({ date: day, days: 6 }) });
  const ranges: [MyWorkPeriodKey, string, string][] = [
    ["today", today, today],
    ["tomorrow", tomorrow, tomorrow],
    ["week", today, weekEnd],
  ];
  return ranges.map(([key, from, to]) => ({
    key,
    from,
    to,
    href: myWorkHref({ from, to, today }),
  }));
}

/** Which preset the range is, or null for any other range. */
export function activePeriod({
  periods,
  from,
  to,
}: {
  periods: MyWorkPeriod[];
  from: string;
  to: string;
}) {
  return periods.find((period) => period.from === from && period.to === to)?.key ?? null;
}
