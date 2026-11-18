import { z } from "zod";

export const LineHoursCheckInputSchema = z.object({
  itemId: z.string().min(1).describe("Id of the item the line would hold (item.list)"),
  startsAt: z.coerce.date().describe("The line's start, ISO 8601"),
  endsAt: z.coerce.date().describe("The line's end (after the start, exclusive), ISO 8601"),
});

export const LineHoursCheckOutputSchema = z.object({
  kind: z
    .enum(["OUTSIDE_ITEM_HOURS", "OUTSIDE_VENUE_HOURS"])
    .nullable()
    .describe(
      "OUTSIDE_ITEM_HOURS: the time falls outside the item's own working hours (itemHours.get). " +
        "OUTSIDE_VENUE_HOURS: the item has no hours of its own and the time falls outside its " +
        "venue's opening hours (venueHours.get; only with venue:read). null: within the hours, " +
        "or no hours apply",
    ),
  id: z
    .string()
    .nullable()
    .describe("The item (OUTSIDE_ITEM_HOURS) or the venue (OUTSIDE_VENUE_HOURS); null otherwise"),
});

export type LineHoursCheckInput = z.infer<typeof LineHoursCheckInputSchema>;
export type LineHoursCheck = z.infer<typeof LineHoursCheckOutputSchema>;
