import { z } from "zod";
import { PROVIDER_KEYS } from "../../providers/provider-keys";
import { PageInputShape } from "../../shared/page-input";
import { PAYMENT_AMOUNT_MAX_MINOR } from "../payment/schema";
import { ReceivableStatusSchema, SettlementShape } from "../payment/settlement-schema";
import { VatRowSchema } from "../quote/order-line-schema";

/**
 * A deposit request (ADR 0057): a frozen receivable with a fixed amount and its own description.
 * `status` holds only its lifecycle; what is paid is derived from its payments.
 */
export const DepositSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  orderId: z.string(),
  description: z.string().describe("What the customer pays for"),
  amountMinor: z.number().int().describe("Fixed amount in minor units (öre for SEK)"),
  vatRows: z
    .array(VatRowSchema)
    .describe(
      "VAT per rate of the amount, snapshot at create from the order's priced lines (ADR 0093); " +
        "empty = no VAT",
    ),
  currency: z.string(),
  dueDate: z.date().nullable(),
  status: ReceivableStatusSchema.describe("DRAFT, SENT (payments can be requested) or VOID"),
  statusChangedAt: z.date(),
  provider: z
    .enum(PROVIDER_KEYS)
    .nullable()
    .describe(
      "The accounting system it is raised in as a prepayment invoice (ADR 0106), chosen by the " +
        "INVOICE route when it was sent; null = kept in Bibi",
    ),
  providerReference: z
    .string()
    .nullable()
    .describe("The prepayment invoice's document number there; null until raised"),
  providerUrl: z.string().nullable().describe("The provider's page for it, if any"),
  ...SettlementShape,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const DepositListInputSchema = z.object({
  ...PageInputShape,
  orderId: z.string().min(1).describe("Id of the order whose deposit requests to list"),
});

export const DepositListOutputSchema = z.object({
  items: z.array(DepositSchema),
  nextCursor: z.string().nullable(),
});

export const DepositIdInputSchema = z.object({ id: z.string().min(1) });

export const DepositCreateInputSchema = z.object({
  orderId: z.string().min(1).describe("Id of the order the deposit is requested for"),
  description: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .describe("What the customer pays for, shown on the payment"),
  amountMinor: z
    .number()
    .int()
    .min(100)
    .max(PAYMENT_AMOUNT_MAX_MINOR)
    .describe("Fixed amount in minor units (öre for SEK), at least 100"),
  dueDate: z.coerce.date().nullish().describe("When the deposit is due, ISO 8601"),
});

export const DepositSuggestInputSchema = z.object({
  orderId: z.string().min(1).describe("Id of the order to suggest a deposit for"),
});

/** What the organization's deposit rule asks of an order (ADR 0090). */
export const DepositSuggestionSchema = z.object({
  totalInclVatMinor: z.number().int().describe("The order's priced lines incl. VAT"),
  basis: z
    .enum(["PERCENT", "FULL", "NONE"])
    .describe(
      "PERCENT: depositPercent of the total. FULL: the total is below depositMinimumMinor, so " +
        "it is paid in full up front. NONE: no deposit rule, give an amount",
    ),
  amountMinor: z.number().int().nullable().describe("The suggested amount; null when NONE"),
  paymentLinksAvailable: z
    .boolean()
    .describe(
      "True when the organization's own Stripe account is active, so /pay links can be sent. " +
        "Without it deposit.request and card payments are unavailable (ADR 0090)",
    ),
  ledgerConnected: z
    .boolean()
    .describe(
      "True when an accounting system (Fortnox, Visma) is connected and takes invoices. Without " +
        "it no deposit, invoice or payment link can be made (ADR 0106)",
    ),
});

export const DepositRequestInputSchema = DepositCreateInputSchema.extend({
  amountMinor: DepositCreateInputSchema.shape.amountMinor
    .optional()
    .describe("Minor units, at least 100; defaults to the organization's deposit rule"),
});

export type DepositDto = z.infer<typeof DepositSchema>;
export type DepositSuggestion = z.infer<typeof DepositSuggestionSchema>;
export type DepositRequestInput = z.infer<typeof DepositRequestInputSchema>;
export type DepositPage = z.infer<typeof DepositListOutputSchema>;
export type DepositCreateInput = z.infer<typeof DepositCreateInputSchema>;
export type DepositIdInput = z.infer<typeof DepositIdInputSchema>;
