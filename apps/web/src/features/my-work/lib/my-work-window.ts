import { addDays, MY_WORK_MAX_DAYS, parseIsoDate, toIsoDate } from "@bibi/core/schemas";
import { ROUTES } from "@/lib/routes";

export type MyWorkWindow = { from: string; to: string };

const shift = ({ day, days }: { day: string; days: number }) =>
  toIsoDate({ date: addDays({ date: parseIsoDate({ value: day }), days }) });

/** The window that starts on `from`: `MY_WORK_MAX_DAYS` days, inclusive (ADR 0064). */
export const windowFrom = ({ from }: { from: string }): MyWorkWindow => ({
  from,
  to: shift({ day: from, days: MY_WORK_MAX_DAYS - 1 }),
});

/** `/` for the window from today, else `/my-work/{from}/{to}`. */
export function myWorkHref({ from, to, today }: MyWorkWindow & { today: string }) {
  const start = windowFrom({ from: today });
  return from === start.from && to === start.to ? ROUTES.home : `${ROUTES.myWork}/${from}/${to}`;
}

/** The link to the next window, right after `to`. */
export function laterHref({ to, today }: { to: string; today: string }) {
  return myWorkHref({ ...windowFrom({ from: shift({ day: to, days: 1 }) }), today });
}
