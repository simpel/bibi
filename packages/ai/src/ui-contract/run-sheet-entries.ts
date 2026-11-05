import { RunSheetSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a run sheet version as tool results carry it (dates = ISO strings). */
export const RunSheetWireSchema = RunSheetSchema.extend({
  publishedAt: z.string().nullable(),
  fulfilledAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const RunSheetListWireSchema = z.object({
  items: z.array(RunSheetWireSchema),
  nextCursor: z.string().nullable(),
});

export type RunSheetWire = z.infer<typeof RunSheetWireSchema>;

const runSheetTable = uiEntry({
  component: "run-sheet-table",
  schema: RunSheetListWireSchema,
  toProps: ({ value }) => value,
});
const runSheetCard = uiEntry({
  component: "run-sheet-card",
  schema: RunSheetWireSchema,
  toProps: ({ value }) => ({ runSheet: value }),
});

/** Tool → component for an order's versioned run sheets with their ★ change markers (ADR 0021). */
export const RUN_SHEET_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  runSheet_list: runSheetTable,
  runSheet_get: runSheetCard,
  runSheet_generate: runSheetCard,
  runSheet_publish: runSheetCard,
  runSheet_fulfill: runSheetCard,
  runSheet_unfulfill: runSheetCard,
};
