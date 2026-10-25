import { HoursSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** Weekly hours with dated exceptions; plain strings and numbers, so the wire form is the schema. */
export type HoursWire = z.infer<typeof HoursSchema>;

const hoursCard = uiEntry({
  component: "hours-card",
  schema: HoursSchema,
  toProps: ({ value }) => ({ hours: value }),
});

/** Tool → component for venue opening hours and item working hours (ADR 0064 rule 10). */
export const HOURS_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  venueHours_get: hoursCard,
  venueHours_set: hoursCard,
  itemHours_get: hoursCard,
  itemHours_set: hoursCard,
};
