import { ItemStateSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of an item state as tool results carry it (dates = ISO strings). */
export const ItemStateWireSchema = ItemStateSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const ItemStateListWireSchema = z.object({
  items: z.array(ItemStateWireSchema),
  nextCursor: z.string().nullable(),
});

export type ItemStateWire = z.infer<typeof ItemStateWireSchema>;

const stateTable = uiEntry({
  component: "item-state-table",
  schema: ItemStateListWireSchema,
  toProps: ({ value }) => value,
});
const stateCard = uiEntry({
  component: "item-state-card",
  schema: ItemStateWireSchema,
  toProps: ({ value }) => ({ state: value }),
});

/** Tool → component for the organization's item states (ADR 0044). */
export const ITEM_STATE_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  itemState_list: stateTable,
  itemState_get: stateCard,
  itemState_create: stateCard,
  itemState_update: stateCard,
  itemState_archive: stateCard,
  itemState_reorder: stateTable,
  itemState_setTransitions: stateCard,
};
