import { addDays, parseIsoDate, toIsoDate } from "@bibi/core/schemas";
import { fromLocalInputValue, toLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { IntakeWhen } from "./intake-state";

export type IntakePeriod = { startsAt: Date; endsAt: Date };

export type PeriodOfInput = { when: IntakeWhen; timeZone: string };

/**
 * The typed day and times as instants in the organization's zone (ADR 0064: converted at the
 * edge). A `to` at or before `from` ends the next day. Null when the values are not a period.
 */
export function periodOf({ when, timeZone }: PeriodOfInput): IntakePeriod | null {
  const startsAt = fromLocalInputValue({ value: `${when.date}T${when.from}`, timeZone });
  const sameDay = fromLocalInputValue({ value: `${when.date}T${when.to}`, timeZone });
  if (!startsAt || !sameDay) return null;
  if (sameDay > startsAt) return { startsAt, endsAt: sameDay };
  const nextDay = toIsoDate({
    date: addDays({ date: parseIsoDate({ value: when.date }), days: 1 }),
  });
  const endsAt = fromLocalInputValue({ value: `${nextDay}T${when.to}`, timeZone });
  return endsAt ? { startsAt, endsAt } : null;
}

export type WhenOfInput = IntakePeriod & { guests: number; timeZone: string };

/** Instants back to the typed shape: the start's day and both wall times in `timeZone`. */
export function whenOf({ startsAt, endsAt, guests, timeZone }: WhenOfInput): IntakeWhen {
  const [date = "", from = ""] = toLocalInputValue({ date: startsAt, timeZone }).split("T");
  const [, to = ""] = toLocalInputValue({ date: endsAt, timeZone }).split("T");
  return { date, from, to, guests };
}
