import { DashboardSummarySchema } from "@bibi/core/schemas";
import type { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** The summary has no dates, so its tool result is already the wire form. */
export type DashboardSummaryWire = z.infer<typeof DashboardSummarySchema>;

/** Tool → component for the dashboard (ADR 0079). */
export const DASHBOARD_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  dashboard_summary: uiEntry({
    component: "dashboard-summary",
    schema: DashboardSummarySchema,
    toProps: ({ value }) => ({ summary: value }),
  }),
};
