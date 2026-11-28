import type { FloorPlanData } from "@/features/reservation/ui/floor-plan-panel";
import type { CombinationRow, TableRow } from "./layout-tables";

/** One sitting with the floor it runs on, ready for the Tables tabs. */
export type SittingTables = {
  sittingId: string;
  sittingName: string;
  layoutId: string;
  layoutName: string;
  plan: FloorPlanData;
  tables: TableRow[];
  combinations: CombinationRow[];
  /** Changes when a table changes, so the editor starts from the saved values again. */
  signature: string;
};
