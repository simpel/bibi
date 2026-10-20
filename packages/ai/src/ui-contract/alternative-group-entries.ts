import { AlternativeGroupSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of an alternative group as tool results carry it (dates = ISO strings). */
export const AlternativeGroupWireSchema = AlternativeGroupSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const AlternativeGroupListWireSchema = z.object({
  items: z.array(AlternativeGroupWireSchema),
  nextCursor: z.string().nullable(),
});

export type AlternativeGroupWire = z.infer<typeof AlternativeGroupWireSchema>;

const groupTable = uiEntry({
  component: "alternative-group-table",
  schema: AlternativeGroupListWireSchema,
  toProps: ({ value }) => value,
});
const groupCard = uiEntry({
  component: "alternative-group-card",
  schema: AlternativeGroupWireSchema,
  toProps: ({ value }) => ({ group: value }),
});

/** Tool → component for a ticket's alternative groups (ADR 0052). */
export const ALTERNATIVE_GROUP_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  alternativeGroup_list: groupTable,
  alternativeGroup_get: groupCard,
  alternativeGroup_create: groupCard,
  alternativeGroup_update: groupCard,
  alternativeGroup_archive: groupCard,
  alternativeGroup_choose: groupCard,
};
