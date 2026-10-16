import { SheetSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a sheet version as tool results carry it (dates = ISO strings). */
export const SheetWireSchema = SheetSchema.extend({
  sentAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const SheetListWireSchema = z.object({
  items: z.array(SheetWireSchema),
  nextCursor: z.string().nullable(),
});

export type SheetWire = z.infer<typeof SheetWireSchema>;

const sheetTable = uiEntry({
  component: "sheet-table",
  schema: SheetListWireSchema,
  toProps: ({ value }) => value,
});
const sheetCard = uiEntry({
  component: "sheet-card",
  schema: SheetWireSchema,
  toProps: ({ value }) => ({ sheet: value }),
});

/** Tool → component for a booking's versioned sheets with their ★ change markers (ADR 0021). */
export const SHEET_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  sheet_list: sheetTable,
  sheet_get: sheetCard,
  sheet_generate: sheetCard,
  sheet_send: sheetCard,
};
