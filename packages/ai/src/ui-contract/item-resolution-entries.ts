import { ItemResolutionSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of `item.resolve` (no dates, so the core schema as is). */
export const ItemResolutionWireSchema = ItemResolutionSchema;

export type ItemResolutionWire = z.infer<typeof ItemResolutionWireSchema>;

/** Tool → component for an item expanded into its parts with inherited list values (ADR 0021). */
export const ITEM_RESOLUTION_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  item_resolve: uiEntry({
    component: "item-resolution-card",
    schema: ItemResolutionWireSchema,
    toProps: ({ value }) => ({ resolution: value }),
  }),
};
