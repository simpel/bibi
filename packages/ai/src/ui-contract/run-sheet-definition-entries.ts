import { RunSheetDefinitionSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a run sheet definition as tool results carry it (dates = ISO strings). */
export const RunSheetDefinitionWireSchema = RunSheetDefinitionSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const RunSheetDefinitionListWireSchema = z.object({
  items: z.array(RunSheetDefinitionWireSchema),
  nextCursor: z.string().nullable(),
});

export type RunSheetDefinitionWire = z.infer<typeof RunSheetDefinitionWireSchema>;

const runSheetTable = uiEntry({
  component: "run-sheet-definition-table",
  schema: RunSheetDefinitionListWireSchema,
  toProps: ({ value }) => value,
});
const runSheetCard = uiEntry({
  component: "run-sheet-definition-card",
  schema: RunSheetDefinitionWireSchema,
  toProps: ({ value }) => ({ runSheet: value }),
});

/** Tool → component for the organization's run sheet definitions (ADR 0021). */
export const RUN_SHEET_DEFINITION_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  runSheetDefinition_list: runSheetTable,
  runSheetDefinition_get: runSheetCard,
  runSheetDefinition_create: runSheetCard,
  runSheetDefinition_update: runSheetCard,
  runSheetDefinition_archive: runSheetCard,
};
