import { z } from "zod";
import { PROVIDER_KEYS } from "../../providers/provider-keys";
import { PageInputShape } from "../../shared/page-input";
import { ReceivableStatusSchema, SettlementShape } from "../payment/settlement-schema";
import { OrderLineSchema } from "../quote/order-line-schema";

/** A paid deposit the invoice deducts (ADR 0090), as paid when the invoice was created. */
export const InvoiceDeductionSchema = z.object({
  depositId: z.string(),
  description: z.string().describe("The deposit's own description"),
  amountMinor: z.number().int().describe("Paid on the deposit at invoice create, minor units"),
});

/** A credit note of the invoice (ADR 0100): what it credits incl. VAT. */
export const InvoiceCreditNoteSchema = z.object({
  id: z.string(),
  documentNumber: z
    .string()
    .nullable()
    .describe(
      "The number it carries: the accounting system's document number (ADR 0106); null until " +
        "raised there",
    ),
  amountMinor: z.number().int().describe("Credited incl. VAT, minor units"),
  status: z
    .enum(["PENDING", "ISSUED", "FAILED"])
    .describe("PENDING until the provider confirmed it; FAILED ones credit nothing"),
});

/**
 * An invoice (ADR 0052, 0057): a frozen receivable whose lines are a snapshot of the order's
 * priced lines when it was created. `status` holds only its lifecycle; what is paid is derived.
 */
export const InvoiceSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  orderId: z.string(),
  documentNumber: z
    .string()
    .nullable()
    .describe(
      "The number it carries: the accounting system's document number (ADR 0106); null until " +
        "raised there",
    ),
  currency: z.string(),
  dueDate: z.date().nullable(),
  status: ReceivableStatusSchema.describe("DRAFT, SENT (payments can be requested) or VOID"),
  statusChangedAt: z.date(),
  totalExclVatMinor: z.number().int().describe("Sum of the frozen lines excl. VAT, minor units"),
  totalInclVatMinor: z
    .number()
    .int()
    .describe("Sum of the frozen lines incl. VAT, minor units: the amount owed"),
  buyerReference: z
    .string()
    .nullable()
    .describe("The buyer's reference (Er referens) it carries, frozen at create (ADR 0105)"),
  lines: z.array(OrderLineSchema).describe("The order's priced lines, frozen at create"),
  deductions: z
    .array(InvoiceDeductionSchema)
    .describe("Paid deposits deducted from the total, frozen at create (ADR 0090)"),
  provider: z
    .enum(PROVIDER_KEYS)
    .nullable()
    .describe(
      "Where it was raised when sent (ADR 0090, 0100): the provider the INVOICE route chose " +
        "(an accounting system whose payments are mirrored, or a payment operator's invoicing) " +
        "or null (in Bibi only)",
    ),
  providerReference: z
    .string()
    .nullable()
    .describe("The invoice's document number at the provider; null until raised there"),
  providerUrl: z.string().nullable().describe("The provider's page for the invoice, if any"),
  creditNotes: z.array(InvoiceCreditNoteSchema).describe("Its credit notes (invoice.credit)"),
  creditedMinor: z
    .number()
    .int()
    .describe("What its credit notes that did not fail credit, minor units"),
  amountDueMinor: z
    .number()
    .int()
    .describe(
      "Total incl. VAT minus the deductions and the credited amount, minor units: what " +
        "payments settle",
    ),
  ...SettlementShape,
  canSync: z
    .boolean()
    .describe("invoice.sync can run: SENT and raised in a provider that keeps invoices"),
  canCredit: z.boolean().describe("invoice.credit can run: SENT with an amount still due"),
  canVoid: z
    .boolean()
    .describe(
      "invoice.void can run: not VOID, nothing paid and not booked in an accounting system " +
        "(credit it instead)",
    ),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const InvoiceListInputSchema = z.object({
  ...PageInputShape,
  orderId: z.string().min(1).describe("Id of the order whose invoices to list"),
});

export const InvoiceListOutputSchema = z.object({
  items: z.array(InvoiceSchema),
  nextCursor: z.string().nullable(),
});

export const InvoiceIdInputSchema = z.object({ id: z.string().min(1) });

export const InvoiceCreateInputSchema = z.object({
  orderId: z.string().min(1).describe("Id of the order to invoice; its status must be invoiceable"),
  dueDate: z.coerce
    .date()
    .nullish()
    .describe("When the invoice is due, ISO 8601; defaults to the customer's payment terms"),
});

export type InvoiceDto = z.infer<typeof InvoiceSchema>;
export type InvoicePage = z.infer<typeof InvoiceListOutputSchema>;
export type InvoiceCreateInput = z.infer<typeof InvoiceCreateInputSchema>;
export type InvoiceIdInput = z.infer<typeof InvoiceIdInputSchema>;
