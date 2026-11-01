import {
  AccountingExportFileSchema,
  AccountingExportPreviewSchema,
  AccountingExportSchema,
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

/** JSON form of an export as tool results carry it (dates = ISO strings). */
export const AccountingExportWireSchema = AccountingExportSchema.extend({
  periodStart: z.string().nullable(),
  periodEnd: z.string().nullable(),
  createdAt: z.string(),
});

export type AccountingExportWire = z.infer<typeof AccountingExportWireSchema>;
export type AccountingExportPreviewWire = z.infer<typeof AccountingExportPreviewSchema>;

const exportCard = uiEntry({
  component: "accounting-export-card",
  schema: AccountingExportWireSchema,
  toProps: ({ value }) => ({ accountingExport: value }),
});

/** Tool → component for the financials overview (ADR 0077). */
export const FINANCE_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  finance_overview: uiEntry({
    component: "finance-overview",
    schema: FinanceOverviewWireSchema,
    toProps: ({ value }) => ({ overview: value }),
  }),
  accountingExport_preview: uiEntry({
    component: "accounting-export-preview",
    schema: AccountingExportPreviewSchema,
    toProps: ({ value }) => ({ preview: value }),
  }),
  accountingExport_create: exportCard,
  accountingExport_get: exportCard,
  // The file's base64 bytes are dropped here: only its name and size ever reach the card.
  accountingExport_download: uiEntry({
    component: "accounting-export-file",
    schema: AccountingExportFileSchema,
    toProps: ({ value }) => ({ file: { filename: value.filename, size: value.size } }),
  }),
};
