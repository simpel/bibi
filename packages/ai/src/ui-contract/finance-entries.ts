import {
  FinanceAgingSchema,
  FinanceOverviewSchema,
  OverdueInvoiceSchema,
} from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of the finance overview as tool results carry it (dates = ISO strings). */
export const FinanceOverviewWireSchema = FinanceOverviewSchema.extend({
  aging: FinanceAgingSchema.extend({
    overdue: z.array(OverdueInvoiceSchema.extend({ dueDate: z.string() })),
  }).nullable(),
});

export type FinanceOverviewWire = z.infer<typeof FinanceOverviewWireSchema>;

/** Tool → component for the financials overview (ADR 0077). */
export const FINANCE_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  finance_overview: uiEntry({
    component: "finance-overview",
    schema: FinanceOverviewWireSchema,
    toProps: ({ value }) => ({ overview: value }),
  }),
};
