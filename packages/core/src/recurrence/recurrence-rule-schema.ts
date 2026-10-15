import { z } from "zod";

export const RECURRENCE_FREQUENCIES = ["WEEKLY", "MONTHLY"] as const;
export const WEEKDAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;

/** `TU`, or with an ordinal within the month: `1TU` (first Tuesday), `-1FR` (last Friday). */
export const BY_DAY_PATTERN = /^([+-]?[1-5])?(MO|TU|WE|TH|FR|SA|SU)$/;

const ByDaySchema = z
  .string()
  .regex(BY_DAY_PATTERN, "Use a weekday code (MO–SU), optionally with an ordinal 1–5 or -1 to -5")
  .describe("Weekday, e.g. TH, or nth weekday of the month, e.g. 1TU");

type RuleShape = {
  freq: (typeof RECURRENCE_FREQUENCIES)[number];
  byDay?: string[] | undefined;
  byMonthDay?: number[] | undefined;
  count?: number | undefined;
  until?: string | undefined;
};

function checkRule({ rule, ctx }: { rule: RuleShape; ctx: z.RefinementCtx }): void {
  const issue = ({ path, message }: { path: (string | number)[]; message: string }) =>
    ctx.addIssue({ code: "custom", path, message });
  if (rule.count !== undefined && rule.until !== undefined) {
    issue({ path: ["until"], message: "COUNT and UNTIL cannot be combined" });
  }
  if (rule.byDay && new Set(rule.byDay).size !== rule.byDay.length) {
    issue({ path: ["byDay"], message: "Each weekday may appear only once" });
  }
  if (rule.byMonthDay && new Set(rule.byMonthDay).size !== rule.byMonthDay.length) {
    issue({ path: ["byMonthDay"], message: "Each day of the month may appear only once" });
  }
  if (rule.freq === "WEEKLY" && rule.byMonthDay) {
    issue({ path: ["byMonthDay"], message: "BYMONTHDAY requires FREQ=MONTHLY" });
  }
  if (rule.freq === "MONTHLY" && rule.byDay && rule.byMonthDay) {
    issue({ path: ["byMonthDay"], message: "Use either BYDAY or BYMONTHDAY, not both" });
  }
  rule.byDay?.forEach((token, index) => {
    if (rule.freq === "WEEKLY" && /^[+-]?\d/.test(token)) {
      issue({ path: ["byDay", index], message: "Ordinal weekdays require FREQ=MONTHLY" });
    }
  });
}

/**
 * Structured form of the RRULE subset in ADR 0023. Without COUNT or UNTIL the series is
 * open-ended; occurrences are generated at most 12 months or 52 occurrences ahead.
 */
export const RecurrenceRuleSchema = z
  .object({
    freq: z.enum(RECURRENCE_FREQUENCIES).describe("WEEKLY or MONTHLY"),
    interval: z.number().int().min(1).max(52).default(1).describe("Every n weeks or months"),
    byDay: z.array(ByDaySchema).min(1).max(7).optional(),
    byMonthDay: z
      .array(z.number().int().min(1).max(31))
      .min(1)
      .max(31)
      .optional()
      .describe("Days of the month; months without that day are skipped"),
    count: z.number().int().min(1).max(1000).optional().describe("Total number of occurrences"),
    until: z.iso.date().optional().describe("Last possible date (inclusive), YYYY-MM-DD"),
  })
  .superRefine((rule, ctx) => checkRule({ rule, ctx }));

export type RecurrenceRule = z.infer<typeof RecurrenceRuleSchema>;
export type RecurrenceRuleInput = z.input<typeof RecurrenceRuleSchema>;
