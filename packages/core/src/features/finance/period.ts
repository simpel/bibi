import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { addDays, compareDates, type PlainDate, parseIsoDate } from "../../time/plain-date";
import { fromZonedParts, toZonedParts } from "../../time/zoned-time";
import { type FinanceOverviewInput, MAX_FINANCE_MONTHS } from "./schema";

const MIDNIGHT = { hour: 0, minute: 0, second: 0 };

/** The period as instants `[start of from, start of to + 1 day)` in the organization's zone. */
export type FinancePeriod = {
  timeZone: string;
  start: Date;
  end: Date;
  months: string[];
  /** The `YYYY-MM` an instant falls in, in the organization's zone. */
  monthOf: (input: { instant: Date }) => string;
};

const monthKey = ({ date }: { date: PlainDate }) =>
  `${date.year}-${String(date.month).padStart(2, "0")}`;

/** Every month from `from`'s to `to`'s, in order. */
function monthsBetween({ from, to }: { from: PlainDate; to: PlainDate }): string[] {
  const months: string[] = [];
  let { year, month } = from;
  while (year < to.year || (year === to.year && month <= to.month)) {
    months.push(monthKey({ date: { year, month, day: 1 } }));
    month = month === 12 ? 1 : month + 1;
    year = month === 1 ? year + 1 : year;
  }
  return months;
}

export type ResolvePeriodInput = {
  context: Pick<OperationContext, "db">;
  input: FinanceOverviewInput;
};

/** `from` on or before `to`, at most `MAX_FINANCE_MONTHS` months; VALIDATION otherwise. */
export async function resolvePeriod({
  context,
  input,
}: ResolvePeriodInput): Promise<Result<FinancePeriod>> {
  const from = parseIsoDate({ value: input.from });
  const to = parseIsoDate({ value: input.to });
  if (compareDates({ a: to, b: from }) < 0) {
    const issues = [{ path: "to", message: "Must be on or after from" }];
    return invalid({ message: "from is after to", issues });
  }
  if (monthsBetween({ from, to }).length > MAX_FINANCE_MONTHS) {
    const message = `At most ${MAX_FINANCE_MONTHS} months`;
    return invalid({ message, issues: [{ path: "to", message }] });
  }
  const timeZone = (await loadZoneOfVenue({ context }))({ venue: null });
  return ok({ value: periodOf({ from, to, timeZone }) });
}

export type PeriodOfInput = { from: PlainDate; to: PlainDate; timeZone: string };

/** The instants and months of `[from, to]` in `timeZone`, with no length check. */
export function periodOf({ from, to, timeZone }: PeriodOfInput): FinancePeriod {
  const start = fromZonedParts({ date: from, time: MIDNIGHT, timeZone });
  const end = fromZonedParts({ date: addDays({ date: to, days: 1 }), time: MIDNIGHT, timeZone });
  const monthOf = ({ instant }: { instant: Date }) =>
    monthKey({ date: toZonedParts({ instant, timeZone }).date });
  return { timeZone, start, end, months: monthsBetween({ from, to }), monthOf };
}
