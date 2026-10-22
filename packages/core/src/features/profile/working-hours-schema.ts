import { z } from "zod";
import { MinuteOfDaySchema } from "../../shared/minute-of-day";

/** One working day (ADR 0061); minutes after midnight, a missing weekday is a day off. */
export const WorkingDaySchema = z.object({
  weekday: z.number().int().min(0).max(6).describe("0 = Monday … 6 = Sunday"),
  startMinute: MinuteOfDaySchema,
  endMinute: MinuteOfDaySchema,
  breakStartMinute: MinuteOfDaySchema.nullable(),
  breakEndMinute: MinuteOfDaySchema.nullable(),
});

type Day = z.infer<typeof WorkingDaySchema>;
type Issue = { message: string; path: (string | number)[] };

/** Problems of one day: start before end, break both-or-neither and inside the day. */
function dayIssues({ day, index }: { day: Day; index: number }): Issue[] {
  const at = ({ field }: { field: string }) => ["days", index, field];
  const issues: Issue[] = [];
  if (day.startMinute >= day.endMinute) {
    issues.push({ message: "The day must start before it ends", path: at({ field: "endMinute" }) });
  }
  const { breakStartMinute: from, breakEndMinute: to } = day;
  if ((from === null) !== (to === null)) {
    issues.push({
      message: "Set both break start and end, or neither",
      path: at({ field: "breakEndMinute" }),
    });
  } else if (from !== null && to !== null) {
    if (from >= to || from < day.startMinute || to > day.endMinute) {
      const message = "The break must start before it ends and lie inside the working day";
      issues.push({ message, path: at({ field: "breakStartMinute" }) });
    }
  }
  return issues;
}

export const WorkingHoursSchema = z.object({
  days: z.array(WorkingDaySchema).describe("Working days sorted by weekday"),
});

export const WorkingHoursGetInputSchema = z.object({});

export const WorkingHoursSetInputSchema = z
  .object({
    days: z
      .array(WorkingDaySchema)
      .max(7)
      .describe("Every working day; replaces all earlier ones (a missing weekday is a day off)"),
  })
  .superRefine(({ days }, ctx) => {
    const seen = new Set<number>();
    days.forEach((day, index) => {
      if (seen.has(day.weekday)) {
        ctx.addIssue({ code: "custom", message: "Weekday listed twice", path: ["days", index] });
      }
      seen.add(day.weekday);
      for (const issue of dayIssues({ day, index })) ctx.addIssue({ code: "custom", ...issue });
    });
  });

const OFFICE_DAY = {
  startMinute: 480,
  endMinute: 1020,
  breakStartMinute: 720,
  breakEndMinute: 780,
} as const;

/** The welcome flow's suggestion: Monday–Friday 08:00–17:00 with lunch 12:00–13:00. */
export const DEFAULT_WORKING_HOURS: readonly Day[] = [0, 1, 2, 3, 4].map((weekday) => ({
  weekday,
  ...OFFICE_DAY,
}));

export type WorkingDay = Day;
export type WorkingHoursDto = z.infer<typeof WorkingHoursSchema>;
export type WorkingHoursSetInput = z.infer<typeof WorkingHoursSetInputSchema>;
