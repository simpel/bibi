import {
  AttentionSchema,
  DashboardSummarySchema,
  ExpiringHoldSchema,
  ScheduledSchema,
  UnsentWorkOrderSchema,
} from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of the dashboard as tool results carry it (dates = ISO strings). */
export const DashboardSummaryWireSchema = DashboardSummarySchema.extend({
  attention: AttentionSchema.extend({
    expiringHolds: z.array(ExpiringHoldSchema.extend({ holdsUntil: z.string() })),
    unsentWorkOrders: z.array(UnsentWorkOrderSchema.extend({ startsAt: z.string() })).nullable(),
  }),
  scheduled: z.array(ScheduledSchema.extend({ startsAt: z.string() })),
});

export type DashboardSummaryWire = z.infer<typeof DashboardSummaryWireSchema>;

/** Tool → component for the dashboard (ADR 0079, 0080, 0086). */
export const DASHBOARD_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  dashboard_summary: uiEntry({
    component: "dashboard-summary",
    schema: DashboardSummaryWireSchema,
    toProps: ({ value }) => ({ summary: value }),
  }),
};
