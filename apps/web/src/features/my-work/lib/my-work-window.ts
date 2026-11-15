import { addDays, MY_WORK_MAX_DAYS, parseIsoDate, toIsoDate, weekdayOf } from "@bibi/core/schemas";
import { ROUTES } from "@/lib/routes";

export type MyWorkWindow = { from: string; to: string };

/** The parts of the timeline, in order (spec: home). */
export const MY_WORK_SECTIONS = ["today", "thisWeek", "nextWeek", "later"] as const;
export type MyWorkSection = (typeof MY_WORK_SECTIONS)[number];

const shift = ({ day, days }: { day: string; days: number }) =>
  toIsoDate({ date: addDays({ date: parseIsoDate({ value: day }), days }) });

/** The Sunday that ends `day`'s week (weeks start on Monday, ISO). */
const weekEnd = ({ day }: { day: string }) =>
  shift({ day, days: 6 - weekdayOf({ date: parseIsoDate({ value: day }) }) });

/** The first read: today until the end of next week, at most `MY_WORK_MAX_DAYS` (ADR 0064). */
export const startWindow = ({ today }: { today: string }): MyWorkWindow => ({
  from: today,
  to: shift({ day: weekEnd({ day: today }), days: 7 }),
});

/** A window of `MY_WORK_MAX_DAYS` from `from`, as read on scroll. */
export const windowFrom = ({ from }: { from: string }): MyWorkWindow => ({
  from,
  to: shift({ day: from, days: MY_WORK_MAX_DAYS - 1 }),
});

/** Which part of the timeline a day is in. */
export function sectionOf({ day, today }: { day: string; today: string }): MyWorkSection {
  if (day <= today) return "today";
  const thisWeek = weekEnd({ day: today });
  if (day <= thisWeek) return "thisWeek";
  return day <= shift({ day: thisWeek, days: 7 }) ? "nextWeek" : "later";
}

/** `/` for the start window, else `/my-work/{from}/{to}`. */
export function myWorkHref({ from, to, today }: MyWorkWindow & { today: string }) {
  const start = startWindow({ today });
  return from === start.from && to === start.to ? ROUTES.home : `${ROUTES.myWork}/${from}/${to}`;
}
