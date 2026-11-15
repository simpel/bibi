import "server-only";
import {
  addDays,
  MY_WORK_MAX_DAYS,
  parseIsoDate,
  toIsoDate,
  toZonedParts,
} from "@bibi/core/schemas";
import { loadOrganizationTimeZone } from "@/server/time-zones";
import { myWorkHref } from "./lib/my-work-periods";

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

const isDay = ({ value }: { value: string }) =>
  DAY_KEY.test(value) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

/** Today in the organization's zone (ADR 0064). */
export async function myWorkToday(): Promise<string> {
  const timeZone = await loadOrganizationTimeZone();
  return toIsoDate({ date: toZonedParts({ instant: new Date(), timeZone }).date });
}

/**
 * The canonical link when `/my-work/{from}/{to}` is not two valid days in order within
 * `MY_WORK_MAX_DAYS`, or is today alone (`/`); `undefined` when the path is canonical.
 */
export function canonicalMyWorkHref({
  from,
  to,
  today,
}: {
  from: string;
  to: string;
  today: string;
}) {
  if (!isDay({ value: from }) || !isDay({ value: to }) || from > to)
    return myWorkHref({ from: today, to: today, today });
  const last = toIsoDate({
    date: addDays({ date: parseIsoDate({ value: from }), days: MY_WORK_MAX_DAYS - 1 }),
  });
  if (to > last) return myWorkHref({ from, to: last, today });
  return from === today && to === today ? myWorkHref({ from, to, today }) : undefined;
}
