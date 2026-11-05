import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";
import { periodOf } from "./intake-period";

export type FormTimesInput = {
  /** `HH:mm` on the day; both empty = untimed. */
  values: { from: string; to: string };
  /** The line's day, YYYY-MM-DD. */
  date: string;
  timeZone: string;
};

/** Both empty: untimed. One of them: kept, so the schema's period rule names the gap. */
export function formTimes({ values, date, timeZone }: FormTimesInput) {
  const { from, to } = values;
  if (!from && !to) return { startsAt: null, endsAt: null };
  if (!from || !to) {
    const lone = fromLocalInputValue({ value: `${date}T${from || to}`, timeZone }) ?? null;
    return from ? { startsAt: lone, endsAt: null } : { startsAt: null, endsAt: lone };
  }
  const period = periodOf({ when: { date, from, to, guests: 0 }, timeZone });
  return { startsAt: period?.startsAt ?? null, endsAt: period?.endsAt ?? null };
}
