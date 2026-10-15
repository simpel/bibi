import { SheetDefinitionSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a sheet definition as tool results carry it (dates = ISO strings). */
export const SheetDefinitionWireSchema = SheetDefinitionSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const SheetDefinitionListWireSchema = z.object({
  items: z.array(SheetDefinitionWireSchema),
  nextCursor: z.string().nullable(),
});

export type SheetDefinitionWire = z.infer<typeof SheetDefinitionWireSchema>;

const sheetTable = uiEntry({
  component: "sheet-definition-table",
  schema: SheetDefinitionListWireSchema,
  toProps: ({ value }) => value,
});
const sheetCard = uiEntry({
  component: "sheet-definition-card",
  schema: SheetDefinitionWireSchema,
  toProps: ({ value }) => ({ sheet: value }),
});

/** Tool → component for the organization's sheet definitions (ADR 0021). */
export const SHEET_DEFINITION_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  sheetDefinition_list: sheetTable,
  sheetDefinition_get: sheetCard,
  sheetDefinition_create: sheetCard,
  sheetDefinition_update: sheetCard,
  sheetDefinition_archive: sheetCard,
};
