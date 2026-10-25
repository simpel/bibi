import { z } from "zod";
import { MinuteOfDaySchema } from "../shared/minute-of-day";

/** One open day of a weekly pattern (ADR 0064 rule 10); minutes after midnight in the owner's zone. */
export const HoursDaySchema = z.object({
  weekday: z.number().int().min(0).max(6).describe("0 = Monday … 6 = Sunday"),
  startMinute: MinuteOfDaySchema,
  endMinute: MinuteOfDaySchema,
  breakStartMinute: MinuteOfDaySchema.nullable(),
  breakEndMinute: MinuteOfDaySchema.nullable(),
});

/** The minutes of one open span: start, end and an optional break. */
export type OpenSpan = {
  startMinute: number;
  endMinute: number;
  breakStartMinute: number | null;
  breakEndMinute: number | null;
};

export type HoursIssue = { message: string; path: (string | number)[] };

export type SpanIssuesInput = { span: OpenSpan; path: (string | number)[] };

/** Problems of one span: start before end, break both-or-neither and inside the span. */
export function spanIssues({ span, path }: SpanIssuesInput): HoursIssue[] {
  const at = ({ field }: { field: string }) => [...path, field];
  const issues: HoursIssue[] = [];
  if (span.startMinute >= span.endMinute) {
    issues.push({ message: "The day must start before it ends", path: at({ field: "endMinute" }) });
  }
  const { breakStartMinute: from, breakEndMinute: to } = span;
  if ((from === null) !== (to === null)) {
    issues.push({
      message: "Set both break start and end, or neither",
      path: at({ field: "breakEndMinute" }),
    });
  } else if (from !== null && to !== null) {
    if (from >= to || from < span.startMinute || to > span.endMinute) {
      const message = "The break must start before it ends and lie inside the working day";
      issues.push({ message, path: at({ field: "breakStartMinute" }) });
    }
  }
  return issues;
}

type Ctx = z.RefinementCtx;

export type RefineDaysInput = { days: readonly HoursDay[]; ctx: Ctx };

/** Adds an issue per weekday listed twice and per invalid day, under `days`. */
export function refineDays({ days, ctx }: RefineDaysInput) {
  const seen = new Set<number>();
  days.forEach((day, index) => {
    if (seen.has(day.weekday)) {
      ctx.addIssue({ code: "custom", message: "Weekday listed twice", path: ["days", index] });
    }
    seen.add(day.weekday);
    for (const issue of spanIssues({ span: day, path: ["days", index] })) {
      ctx.addIssue({ code: "custom", ...issue });
    }
  });
}

export type HoursDay = z.infer<typeof HoursDaySchema>;
