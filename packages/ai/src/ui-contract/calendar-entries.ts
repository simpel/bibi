import { CalendarBlockSchema, CalendarRangeSchema } from "@bibi/core/schemas";
import { z } from "zod";
import { HOURS_UI_ENTRIES } from "./hours-entries";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of the calendar range as tool results carry it (dates = ISO strings). */
export const CalendarRangeWireSchema = CalendarRangeSchema.extend({
  from: z.string(),
  to: z.string(),
  blocks: z.array(
    CalendarBlockSchema.extend({
      startsAt: z.string(),
      endsAt: z.string(),
      heldAt: z.string().nullable(),
      expiresAt: z.string().nullable(),
    }),
  ),
});

export type CalendarRangeWire = z.infer<typeof CalendarRangeWireSchema>;

/** Tool → component for the occupancy calendar and the hours that shape it (ADR 0064). */
export const CALENDAR_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  ...HOURS_UI_ENTRIES,
  calendar_range: uiEntry({
    component: "calendar-range",
    schema: CalendarRangeWireSchema,
    toProps: ({ value }) => ({ range: value }),
  }),
};
