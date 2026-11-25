import { addDays, parseIsoDate, toIsoDate } from "@bibi/core/schemas";
import { fromLocalInputValue } from "../occupancy/ui/local-date-time";

export type SlotInstantsInput = {
  /** The slot's plain day, "YYYY-MM-DD". */
  date: string;
  /** Wall times, "HH:mm"; a `to` at or before `from` ends the next day, as in the intake. */
  from: string;
  to: string;
  /** The zone the calendar draws in (ADR 0064). */
  timeZone: string;
};

/** A slot's start and end as ISO instants, for `/new/task?from=&to=`. */
export function slotInstants({ date, from, to, timeZone }: SlotInstantsInput) {
  const endDay =
    to <= from
      ? toIsoDate({ date: addDays({ date: parseIsoDate({ value: date }), days: 1 }) })
      : date;
  const start = fromLocalInputValue({ value: `${date}T${from}`, timeZone });
  const end = fromLocalInputValue({ value: `${endDay}T${to}`, timeZone });
  return { from: start?.toISOString(), to: end?.toISOString() };
}
