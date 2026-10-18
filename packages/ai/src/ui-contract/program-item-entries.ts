import { ProgramItemSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a program item as tool results carry it (dates = ISO strings). */
export const ProgramItemWireSchema = ProgramItemSchema.extend({
  startsAt: z.string(),
  endsAt: z.string(),
  heldAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const ProgramItemListWireSchema = z.object({
  items: z.array(ProgramItemWireSchema),
  nextCursor: z.string().nullable(),
});

export type ProgramItemWire = z.infer<typeof ProgramItemWireSchema>;

const programItemTable = uiEntry({
  component: "program-item-table",
  schema: ProgramItemListWireSchema,
  toProps: ({ value }) => value,
});
const programItemCard = uiEntry({
  component: "program-item-card",
  schema: ProgramItemWireSchema,
  toProps: ({ value }) => ({ programItem: value }),
});

/** Tool → component for a ticket's run schedule and its line states (ADR 0022, 0044). */
export const PROGRAM_ITEM_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  programItem_list: programItemTable,
  programItem_get: programItemCard,
  programItem_create: programItemCard,
  programItem_update: programItemCard,
  programItem_archive: programItemCard,
  line_changeState: programItemCard,
  // The lines `ticket.expireHolds` moved to their expiry state (ADR 0044).
  ticket_expireHolds: uiEntry({
    component: "program-item-table",
    schema: z.object({ items: z.array(ProgramItemWireSchema) }),
    toProps: ({ value }) => ({ items: value.items, nextCursor: null }),
  }),
};
