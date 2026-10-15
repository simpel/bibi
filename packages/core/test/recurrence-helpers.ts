import { expandOccurrences } from "../src/index";
import { parseRecurrenceRule } from "../src/recurrence/parse-recurrence-rule";
import type { ExpandOccurrencesOutput, Occurrence } from "../src/schemas";
import { unwrap } from "./helpers";

const STOCKHOLM = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Local Stockholm wall time, `YYYY-MM-DD HH:mm`. */
export function local({ instant }: { instant: Date }): string {
  return STOCKHOLM.format(instant);
}

export function localDates({ occurrences }: { occurrences: Occurrence[] }): string[] {
  return occurrences.map((occurrence) => local({ instant: occurrence.start }).slice(0, 10));
}

export type ExpandRuleInput = { rrule: string; start: string; durationMinutes?: number };

/** Parses `rrule` and expands it from `start` (an ISO instant) in Europe/Stockholm. */
export function expandRule({
  rrule,
  start,
  durationMinutes = 60,
}: ExpandRuleInput): ExpandOccurrencesOutput {
  const rule = unwrap({ result: parseRecurrenceRule({ rrule }) });
  return unwrap({ result: expandOccurrences({ rule, start: new Date(start), durationMinutes }) });
}
