import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";
import { OccupancyListWireSchema, OccupancyWireSchema } from "./wire-schemas";

const occupancyTable = uiEntry({
  component: "occupancy-table",
  schema: OccupancyListWireSchema,
  toProps: ({ value }) => value,
});
const occupancyCard = uiEntry({
  component: "occupancy-card",
  schema: OccupancyWireSchema,
  toProps: ({ value }) => ({ occupancy: value }),
});

/** Tool → component for the occupancy of bookable items (ADR 0022). */
export const OCCUPANCY_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  occupancy_list: occupancyTable,
  occupancy_get: occupancyCard,
  occupancy_create: occupancyCard,
  occupancy_update: occupancyCard,
  occupancy_archive: occupancyCard,
};
