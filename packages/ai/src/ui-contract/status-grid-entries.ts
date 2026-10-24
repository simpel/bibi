import { StatusGridCellSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a status grid cell as tool results carry it (dates = ISO strings). */
export const StatusGridCellWireSchema = StatusGridCellSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const StatusGridWireSchema = z.object({ cells: z.array(StatusGridCellWireSchema) });

export type StatusGridCellWire = z.infer<typeof StatusGridCellWireSchema>;

const gridTable = uiEntry({
  component: "status-grid-table",
  schema: StatusGridWireSchema,
  toProps: ({ value }) => value,
});

/** Tool → component for the status grid (ADR 0044). */
export const STATUS_GRID_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  statusGrid_get: gridTable,
  statusGrid_setCell: gridTable,
  statusGrid_importTemplate: uiEntry({
    component: "status-grid-table",
    schema: z.object({ applied: z.number(), grid: StatusGridWireSchema }),
    toProps: ({ value }) => value.grid,
  }),
};
