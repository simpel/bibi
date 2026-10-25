import { z } from "zod";
import { PlainDateStringSchema } from "../../time/plain-date-schema";

/**
 * What one item's day is worth, excl. VAT in minor units: booked (hard holds) and prebooked (soft
 * holds) are the values of the lines held on it, split over the days each hold covers; open is
 * what the item's free time within its hours would sell for at its hourly price.
 */
export const CalendarDayValueSchema = z.object({
  itemId: z.string(),
  date: PlainDateStringSchema.describe("The local day, YYYY-MM-DD"),
  bookedMinor: z.number().int().nullable().describe("Hard-held lines; null without program:read"),
  prebookedMinor: z
    .number()
    .int()
    .nullable()
    .describe("Soft-held lines; null without program:read"),
  openMinor: z
    .number()
    .int()
    .nullable()
    .describe(
      "Free time within the item's hours (else its venue's, else 08–18) at its hourly list price; " +
        "only items priced PER_HOUR count. Null without item:read or with a line filter",
    ),
});

export type CalendarDayValue = z.infer<typeof CalendarDayValueSchema>;
