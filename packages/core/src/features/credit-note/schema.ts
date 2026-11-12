import { z } from "zod";
import { PROVIDER_KEYS } from "../../providers/provider-keys";
import { PageInputShape } from "../../shared/page-input";
import { OrderLineSchema } from "../quote/order-line-schema";

/**
 * A credit note (ADR 0052, 0100): a credit of a SENT invoice with the credited lines frozen, like
 * an invoice freezes its own. `status` is its lifecycle: PENDING until the provider confirmed it,
 * then ISSUED, or FAILED (it then credits nothing).
 */
export const CreditNoteSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  invoiceId: z.string().describe("The invoice it credits"),
  orderId: z.string().describe("The order of the invoice it credits"),
  documentNumber: z
    .string()
    .nullable()
    .describe(
      "The number it carries: the accounting system's document number (ADR 0106); null until " +
        "raised there",
    ),
  currency: z.string(),
  amountMinor: z.number().int().describe("What it credits incl. VAT, minor units"),
  totalExclVatMinor: z.number().int().describe("Sum of its frozen lines excl. VAT, minor units"),
  totalInclVatMinor: z.number().int().describe("Sum of its frozen lines incl. VAT, minor units"),
  reason: z.string().nullable().describe("Why, shown on the credit note"),
  status: z
    .enum(["PENDING", "ISSUED", "FAILED"])
    .describe("PENDING until the provider confirmed it, then ISSUED; FAILED ones credit nothing"),
  issuedAt: z.date().nullable().describe("When the provider confirmed it"),
  provider: z
    .enum(PROVIDER_KEYS)
    .nullable()
    .describe("Where it was raised: the invoice's provider, or null (in Bibi only)"),
  providerReference: z.string().nullable().describe("Its document id at the provider"),
  providerUrl: z.string().nullable().describe("The provider's page for it, if any"),
  lines: z.array(OrderLineSchema).describe("The credited lines, frozen at credit"),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const CreditNoteIdInputSchema = z.object({ id: z.string().min(1) });

/** Give `invoiceId` or `orderId` (checked by the handler). */
export const CreditNoteListInputSchema = z.object({
  ...PageInputShape,
  invoiceId: z.string().min(1).optional().describe("Only the credit notes of this invoice"),
  orderId: z.string().min(1).optional().describe("Only the credit notes of this order's invoices"),
});

export const CreditNoteListOutputSchema = z.object({
  items: z.array(CreditNoteSchema),
  nextCursor: z.string().nullable(),
});

export type CreditNoteDto = z.infer<typeof CreditNoteSchema>;
export type CreditNoteListInput = z.infer<typeof CreditNoteListInputSchema>;
export type CreditNotePage = z.infer<typeof CreditNoteListOutputSchema>;
