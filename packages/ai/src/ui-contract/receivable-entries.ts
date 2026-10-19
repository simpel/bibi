import { DepositSchema, InvoiceSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

const DATES = {
  dueDate: z.string().nullable(),
  statusChangedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
};

/** JSON forms of deposit requests and invoices as tool results carry them (dates = ISO strings). */
export const DepositWireSchema = DepositSchema.extend(DATES);
export const InvoiceWireSchema = InvoiceSchema.extend(DATES);

export type DepositWire = z.infer<typeof DepositWireSchema>;
export type InvoiceWire = z.infer<typeof InvoiceWireSchema>;

const page = <T extends z.ZodType>({ item }: { item: T }) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() });

const depositCard = uiEntry({
  component: "deposit-card",
  schema: DepositWireSchema,
  toProps: ({ value }) => ({ deposit: value }),
});
const invoiceCard = uiEntry({
  component: "invoice-card",
  schema: InvoiceWireSchema,
  toProps: ({ value }) => ({ invoice: value }),
});

/** Tool → component for the receivables payments settle (ADR 0057). */
export const RECEIVABLE_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  deposit_list: uiEntry({
    component: "deposit-table",
    schema: page({ item: DepositWireSchema }),
    toProps: ({ value }) => value,
  }),
  deposit_get: depositCard,
  deposit_create: depositCard,
  deposit_send: depositCard,
  deposit_void: depositCard,
  invoice_list: uiEntry({
    component: "invoice-table",
    schema: page({ item: InvoiceWireSchema }),
    toProps: ({ value }) => value,
  }),
  invoice_get: invoiceCard,
  invoice_create: invoiceCard,
  invoice_send: invoiceCard,
  invoice_void: invoiceCard,
};
