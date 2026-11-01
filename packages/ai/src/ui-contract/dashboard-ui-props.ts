import type { DashboardSummaryWire } from "./dashboard-entries";

/** Component props of the dashboard card (part of `ToolUiProps`). */
export type DashboardUiProps = {
  "dashboard-summary": { summary: DashboardSummaryWire };
};
