import type { DashboardSummaryWire, MyWorkWire } from "./dashboard-entries";

/** Component props of the dashboard card and the caller's work card (part of `ToolUiProps`). */
export type DashboardUiProps = {
  "dashboard-summary": { summary: DashboardSummaryWire };
  "my-work": { work: MyWorkWire };
};
