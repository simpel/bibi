import { PhaseGridCellSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a phase grid cell as tool results carry it (dates = ISO strings). */
export const PhaseGridCellWireSchema = PhaseGridCellSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const PhaseGridWireSchema = z.object({ cells: z.array(PhaseGridCellWireSchema) });

export type PhaseGridCellWire = z.infer<typeof PhaseGridCellWireSchema>;

const gridTable = uiEntry({
  component: "phase-grid-table",
  schema: PhaseGridWireSchema,
  toProps: ({ value }) => value,
});

/** Tool → component for the phase grid (ADR 0044). */
export const PHASE_GRID_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  phaseGrid_get: gridTable,
  phaseGrid_setCell: gridTable,
  phaseGrid_importTemplate: uiEntry({
    component: "phase-grid-table",
    schema: z.object({ applied: z.number(), grid: PhaseGridWireSchema }),
    toProps: ({ value }) => value.grid,
  }),
};
