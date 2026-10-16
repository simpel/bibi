import { OptionSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of an option as tool results carry it (dates = ISO strings). */
export const OptionWireSchema = OptionSchema.extend({
  startsAt: z.string(),
  endsAt: z.string(),
  expiresAt: z.string(),
  statusChangedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const OptionListWireSchema = z.object({
  items: z.array(OptionWireSchema),
  nextCursor: z.string().nullable(),
});
const OptionExpireDueWireSchema = z.object({ items: z.array(OptionWireSchema) });

export type OptionWire = z.infer<typeof OptionWireSchema>;

const optionCard = uiEntry({
  component: "option-card",
  schema: OptionWireSchema,
  toProps: ({ value }) => ({ option: value }),
});

/** Tool → component for the option queue on bookable items (ADR 0022). */
export const OPTION_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  option_list: uiEntry({
    component: "option-queue",
    schema: OptionListWireSchema,
    toProps: ({ value }) => value,
  }),
  option_get: optionCard,
  option_create: optionCard,
  option_release: optionCard,
  option_expireDue: uiEntry({
    component: "option-queue",
    schema: OptionExpireDueWireSchema,
    toProps: ({ value }) => ({ items: value.items, nextCursor: null }),
  }),
};
