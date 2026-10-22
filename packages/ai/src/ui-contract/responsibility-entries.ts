import { ResponsibilitySchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a responsibility as tool results carry it (dates = ISO strings). */
export const ResponsibilityWireSchema = ResponsibilitySchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const ResponsibilityListWireSchema = z.object({
  items: z.array(ResponsibilityWireSchema),
  nextCursor: z.string().nullable(),
});

export type ResponsibilityWire = z.infer<typeof ResponsibilityWireSchema>;

const responsibilityTable = uiEntry({
  component: "responsibility-table",
  schema: ResponsibilityListWireSchema,
  toProps: ({ value }) => value,
});
const responsibilityCard = uiEntry({
  component: "responsibility-card",
  schema: ResponsibilityWireSchema,
  toProps: ({ value }) => ({ responsibility: value }),
});

/** Tool → component for the organization's responsibilities (ADR 0034). */
export const RESPONSIBILITY_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  responsibility_list: responsibilityTable,
  responsibility_get: responsibilityCard,
  responsibility_create: responsibilityCard,
  responsibility_update: responsibilityCard,
  responsibility_archive: responsibilityCard,
};
