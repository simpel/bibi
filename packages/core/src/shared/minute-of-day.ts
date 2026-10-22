import { z } from "zod";

/** Minutes in a day: 1440 is midnight at the end of the day (an end time). */
export const MINUTES_PER_DAY = 1440;

/** A time of day as minutes after midnight, 0–1440 (e.g. 08:30 = 510). */
export const MinuteOfDaySchema = z
  .number()
  .int()
  .min(0)
  .max(MINUTES_PER_DAY)
  .describe("Minutes after midnight, 0–1440 (08:30 = 510)");
