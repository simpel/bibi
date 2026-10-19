import { LineSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a line as tool results carry it (dates = ISO strings). */
export const LineWireSchema = LineSchema.extend({
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  heldAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const LineListWireSchema = z.object({
  items: z.array(LineWireSchema),
  nextCursor: z.string().nullable(),
});

export type LineWire = z.infer<typeof LineWireSchema>;

const lineTable = uiEntry({
  component: "line-table",
  schema: LineListWireSchema,
  toProps: ({ value }) => value,
});
const lineCard = uiEntry({
  component: "line-card",
  schema: LineWireSchema,
  toProps: ({ value }) => ({ line: value }),
});

/** Tool → component for a ticket's run schedule and its line states (ADR 0022, 0044). */
export const LINE_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  line_list: lineTable,
  line_get: lineCard,
  line_create: lineCard,
  line_update: lineCard,
  line_archive: lineCard,
  line_changeState: lineCard,
  line_followPhase: lineCard,
  // The lines `ticket.expireHolds` moved to their expiry state (ADR 0044).
  ticket_expireHolds: uiEntry({
    component: "line-table",
    schema: z.object({ items: z.array(LineWireSchema) }),
    toProps: ({ value }) => ({ items: value.items, nextCursor: null }),
  }),
};
