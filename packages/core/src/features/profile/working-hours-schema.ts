import { z } from "zod";
import { type HoursDay, HoursDaySchema, refineDays } from "../../hours/day-schema";

/** One working day (ADR 0061); the shared day shape of an hours pattern (ADR 0064). */
export const WorkingDaySchema = HoursDaySchema;

type Day = HoursDay;

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
  .superRefine(({ days }, ctx) => refineDays({ days, ctx }));

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
