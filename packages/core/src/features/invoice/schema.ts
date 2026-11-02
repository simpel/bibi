import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { ReceivableStatusSchema, SettlementShape } from "../payment/settlement-schema";
import { InvoiceProviderSchema } from "../payment-account/settings-schema";
import { OrderLineSchema } from "../quote/order-line-schema";

/** A paid deposit the invoice deducts (ADR 0090), as paid when the invoice was created. */
export const InvoiceDeductionSchema = z.object({
  depositId: z.string(),
  description: z.string().describe("The deposit's own description"),
  amountMinor: z.number().int().describe("Paid on the deposit at invoice create, minor units"),
});

/**
 * An invoice (ADR 0052, 0057): a frozen receivable whose lines are a snapshot of the ticket's
 * priced lines when it was created. `status` holds only its lifecycle; what is paid is derived.
 */
export const InvoiceSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  ticketId: z.string(),
  number: z.number().int().describe("The organization's invoice number"),
  currency: z.string(),
  dueDate: z.date().nullable(),
  status: ReceivableStatusSchema.describe("DRAFT, SENT (payments can be requested) or VOID"),
  statusChangedAt: z.date(),
  totalExclVatMinor: z.number().int().describe("Sum of the frozen lines excl. VAT, minor units"),
  totalInclVatMinor: z
    .number()
    .int()
    .describe("Sum of the frozen lines incl. VAT, minor units: the amount owed"),
  lines: z.array(OrderLineSchema).describe("The ticket's priced lines, frozen at create"),
  deductions: z
    .array(InvoiceDeductionSchema)
    .describe("Paid deposits deducted from the total, frozen at create (ADR 0090)"),
  provider: InvoiceProviderSchema.nullable().describe(
    "Where it was raised when sent (ADR 0090): FORTNOX (the venue's Fortnox, payments mirrored " +
      "from there), STRIPE (paid through a payment Bibi requests) or null (in Bibi only)",
  ),
  providerReference: z
    .string()
    .nullable()
    .describe("The invoice's document number in Fortnox; null until raised there"),
  amountDueMinor: z
    .number()
    .int()
    .describe("Total incl. VAT minus the deductions, minor units: what payments settle"),
  ...SettlementShape,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const InvoiceListInputSchema = z.object({
  ...PageInputShape,
  ticketId: z.string().min(1).describe("Id of the ticket whose invoices to list"),
});

export const InvoiceListOutputSchema = z.object({
  items: z.array(InvoiceSchema),
  nextCursor: z.string().nullable(),
});

export const InvoiceIdInputSchema = z.object({ id: z.string().min(1) });

export const InvoiceCreateInputSchema = z.object({
  ticketId: z
    .string()
    .min(1)
    .describe("Id of the ticket to invoice; its status must be invoiceable"),
  dueDate: z.coerce
    .date()
    .nullish()
    .describe("When the invoice is due, ISO 8601; defaults to the customer's payment terms"),
});

export type InvoiceDto = z.infer<typeof InvoiceSchema>;
export type InvoicePage = z.infer<typeof InvoiceListOutputSchema>;
export type InvoiceCreateInput = z.infer<typeof InvoiceCreateInputSchema>;
export type InvoiceIdInput = z.infer<typeof InvoiceIdInputSchema>;
