import { RequirementSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a requirement as tool results carry it (dates = ISO strings). */
export const RequirementWireSchema = RequirementSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const RequirementListWireSchema = z.object({
  items: z.array(RequirementWireSchema),
  nextCursor: z.string().nullable(),
});

export type RequirementWire = z.infer<typeof RequirementWireSchema>;

const requirementTable = uiEntry({
  component: "requirement-table",
  schema: RequirementListWireSchema,
  toProps: ({ value }) => value,
});
const requirementCard = uiEntry({
  component: "requirement-card",
  schema: RequirementWireSchema,
  toProps: ({ value }) => ({ requirement: value }),
});

/** Tool → component for requirement counts on bookings and program items (ADR 0021). */
export const REQUIREMENT_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  requirement_list: requirementTable,
  requirement_get: requirementCard,
  requirement_create: requirementCard,
  requirement_update: requirementCard,
  requirement_archive: requirementCard,
};
