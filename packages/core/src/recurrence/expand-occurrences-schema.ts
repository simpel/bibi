import { z } from "zod";
import { RecurrenceRuleSchema } from "./recurrence-rule-schema";
import { isValidTimeZone } from "./zoned-time";

export const DEFAULT_SERIES_TIME_ZONE = "Europe/Stockholm";
/** ADR 0023: occurrences are generated at most 12 months or 52 occurrences ahead. */
export const MAX_OCCURRENCES = 52;
export const MAX_HORIZON_MONTHS = 12;

export const ExpandOccurrencesInputSchema = z.object({
  rule: RecurrenceRuleSchema,
  start: z.date().describe("Start of the first occurrence; its wall time is kept for all"),
  durationMinutes: z
    .number()
    .int()
    .min(1)
    .max(7 * 24 * 60),
  timeZone: z
    .string()
    .refine((timeZone) => isValidTimeZone({ timeZone }), "Unknown time zone")
    .default(DEFAULT_SERIES_TIME_ZONE),
});

export const OccurrenceSchema = z.object({
  /** 1-based position in the series. */
  index: z.number().int().min(1),
  start: z.date(),
  end: z.date(),
});

export const ExpandOccurrencesOutputSchema = z.object({
  occurrences: z.array(OccurrenceSchema),
  /** True when the rule continues past the 12-month / 52-occurrence cap. */
  truncated: z.boolean(),
});

export type ExpandOccurrencesInput = z.input<typeof ExpandOccurrencesInputSchema>;
export type Occurrence = z.infer<typeof OccurrenceSchema>;
export type ExpandOccurrencesOutput = z.infer<typeof ExpandOccurrencesOutputSchema>;
