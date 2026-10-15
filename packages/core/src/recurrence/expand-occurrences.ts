import { ok, type Result } from "../errors/result";
import { parseWith } from "../operations/parse-with";
import { candidateDates } from "./candidate-dates";
import {
  type ExpandOccurrencesInput,
  ExpandOccurrencesInputSchema,
  type ExpandOccurrencesOutput,
  MAX_HORIZON_MONTHS,
  MAX_OCCURRENCES,
  type Occurrence,
} from "./expand-occurrences-schema";
import { addMonths, compareDates, parseIsoDate } from "./plain-date";
import type { RecurrenceRule } from "./recurrence-rule-schema";
import { fromZonedParts, toZonedParts } from "./zoned-time";

type CollectInput = {
  rule: RecurrenceRule;
  start: Date;
  durationMinutes: number;
  timeZone: string;
};

function collect({
  rule,
  start,
  durationMinutes,
  timeZone,
}: CollectInput): ExpandOccurrencesOutput {
  const { date: startDate, time } = toZonedParts({ instant: start, timeZone });
  const horizon = {
    ...addMonths({ date: startDate, months: MAX_HORIZON_MONTHS }),
    day: startDate.day,
  };
  const until = rule.until ? parseIsoDate({ value: rule.until }) : undefined;
  const occurrences: Occurrence[] = [];
  for (const date of candidateDates({ rule, startDate, horizon })) {
    if (rule.count !== undefined && occurrences.length >= rule.count) {
      return { occurrences, truncated: false };
    }
    if (until && compareDates({ a: date, b: until }) > 0) return { occurrences, truncated: false };
    if (compareDates({ a: date, b: horizon }) >= 0 || occurrences.length >= MAX_OCCURRENCES) {
      return { occurrences, truncated: true };
    }
    const begin = fromZonedParts({ date, time, timeZone });
    const end = new Date(begin.getTime() + durationMinutes * 60_000);
    occurrences.push({ index: occurrences.length + 1, start: begin, end });
  }
  const exhausted =
    rule.count !== undefined
      ? occurrences.length >= rule.count
      : until !== undefined && compareDates({ a: until, b: horizon }) < 0;
  return { occurrences, truncated: !exhausted };
}

/**
 * Expands a recurrence rule into concrete occurrences in `timeZone` (Europe/Stockholm by default).
 * Every occurrence keeps the wall time of `start`, so it moves in UTC across daylight saving changes.
 * Only dates on or after `start` count. Capped at 12 months from `start` or 52 occurrences;
 * `truncated` tells whether the rule continues past the cap. Invalid input gives `VALIDATION`.
 */
export function expandOccurrences({
  rule,
  start,
  durationMinutes,
  timeZone,
}: ExpandOccurrencesInput): Result<ExpandOccurrencesOutput> {
  const data = { rule, start, durationMinutes, timeZone };
  const parsed = parseWith({ schema: ExpandOccurrencesInputSchema, data, side: "input" });
  if (!parsed.ok) return parsed;
  return ok({ value: collect(parsed.value) });
}
