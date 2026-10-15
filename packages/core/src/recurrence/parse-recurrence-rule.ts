import type { Result } from "../errors/result";
import { parseWith } from "../operations/parse-with";
import type { RecurrenceRule } from "./recurrence-rule-schema";
import { RruleStringSchema } from "./rrule-string-schema";

/** RRULE string → `RecurrenceRule`, or `VALIDATION` with one issue per invalid field. */
export function parseRecurrenceRule({ rrule }: { rrule: string }): Result<RecurrenceRule> {
  return parseWith({ schema: RruleStringSchema, data: rrule, side: "input" });
}
