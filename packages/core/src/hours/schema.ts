import { z } from "zod";
import { MinuteOfDaySchema } from "../shared/minute-of-day";
import { PlainDateStringSchema } from "../time/plain-date-schema";
import { HoursDaySchema, refineDays, spanIssues } from "./day-schema";

/** A dated exception (ADR 0064 rule 10a): closed all day, or other hours on that local day. */
export const HoursExceptionSchema = z.object({
  date: PlainDateStringSchema.describe("The local day, YYYY-MM-DD in the owner's zone"),
  startMinute: MinuteOfDaySchema.nullable().describe("Null with endMinute null: closed all day"),
  endMinute: MinuteOfDaySchema.nullable(),
  breakStartMinute: MinuteOfDaySchema.nullable(),
  breakEndMinute: MinuteOfDaySchema.nullable(),
  note: z.string().trim().max(200).nullable().describe("Why, e.g. a holiday; optional"),
});

/** A weekly pattern with dated exceptions, read in the owner's zone (ADR 0064 rule 10). */
export const HoursSchema = z.object({
  days: z
    .array(HoursDaySchema)
    .describe("Open days sorted by weekday; a missing weekday is closed"),
  exceptions: z.array(HoursExceptionSchema).describe("Dated exceptions sorted by date"),
  timeZone: z.string().describe("The owner's effective zone the minutes are read in"),
});

/** The pattern a `*.set` command replaces the old one with. */
export const HoursPatternShape = {
  days: z
    .array(HoursDaySchema)
    .max(7)
    .describe("Every open day; replaces all earlier ones (a missing weekday is closed)"),
  exceptions: z
    .array(HoursExceptionSchema)
    .max(400)
    .describe("Every dated exception; replaces all earlier ones"),
};

type Exception = z.infer<typeof HoursExceptionSchema>;
type Pattern = { days: z.infer<typeof HoursDaySchema>[]; exceptions: Exception[] };

type RefineExceptionInput = { row: Exception; index: number; ctx: z.RefinementCtx };

function refineException({ row, index, ctx }: RefineExceptionInput) {
  const path = ["exceptions", index];
  const { startMinute, endMinute } = row;
  if (startMinute === null || endMinute === null) {
    const stray =
      startMinute !== endMinute || row.breakStartMinute !== null || row.breakEndMinute !== null;
    if (stray) {
      const message = "A closed day has no times; set start and end for other hours";
      ctx.addIssue({ code: "custom", message, path: [...path, "endMinute"] });
    }
    return;
  }
  const span = { ...row, startMinute, endMinute };
  for (const issue of spanIssues({ span, path })) ctx.addIssue({ code: "custom", ...issue });
}

export type RefineHoursInput = { pattern: Pattern; ctx: z.RefinementCtx };

/** Weekdays and dates at most once, valid spans; issues under `days` and `exceptions`. */
export function refineHours({ pattern: { days, exceptions }, ctx }: RefineHoursInput) {
  refineDays({ days, ctx });
  const seen = new Set<string>();
  exceptions.forEach((row, index) => {
    if (seen.has(row.date)) {
      ctx.addIssue({ code: "custom", message: "Date listed twice", path: ["exceptions", index] });
    }
    seen.add(row.date);
    refineException({ row, index, ctx });
  });
}

export type HoursException = Exception;
export type HoursDto = z.infer<typeof HoursSchema>;
export type HoursPattern = Pattern;
