import {
  AttentionSchema,
  DashboardSummarySchema,
  ExpiringHoldSchema,
  MyWorkCardSchema,
  MyWorkFlagSchema,
  MyWorkSchema,
  ScheduledSchema,
  UnsentRunSheetSchema,
} from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

const ExpiringHoldWireSchema = ExpiringHoldSchema.extend({ holdsUntil: z.string() });

/** JSON form of the dashboard as tool results carry it (dates = ISO strings). */
export const DashboardSummaryWireSchema = DashboardSummarySchema.extend({
  attention: AttentionSchema.extend({
    expiringHolds: z.array(ExpiringHoldWireSchema),
    unsentRunSheets: z.array(UnsentRunSheetSchema.extend({ startsAt: z.string() })).nullable(),
  }),
  scheduled: z.array(ScheduledSchema.extend({ startsAt: z.string() })),
});

export type DashboardSummaryWire = z.infer<typeof DashboardSummaryWireSchema>;

/** JSON form of the caller's start page as tool results carry it (dates = ISO strings). */
export const MyWorkWireSchema = MyWorkSchema.extend({
  now: z.string(),
  cards: z
    .array(
      MyWorkCardSchema.extend({
        startsAt: z.string(),
        endsAt: z.string(),
        flags: z.array(MyWorkFlagSchema.extend({ at: z.string().nullable() })),
      }),
    )
    .nullable(),
});

export type MyWorkWire = z.infer<typeof MyWorkWireSchema>;

/** Tool → component for the dashboard (ADR 0079, 0080, 0086) and the caller's own work. */
export const DASHBOARD_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  dashboard_summary: uiEntry({
    component: "dashboard-summary",
    schema: DashboardSummaryWireSchema,
    toProps: ({ value }) => ({ summary: value }),
  }),
  myWork_view: uiEntry({
    component: "my-work",
    schema: MyWorkWireSchema,
    toProps: ({ value }) => ({ work: value }),
  }),
};
