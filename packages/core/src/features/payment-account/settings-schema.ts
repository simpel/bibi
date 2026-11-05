import { z } from "zod";
import { PAYMENT_AMOUNT_MAX_MINOR } from "../payment/schema";

export const InvoiceProviderSchema = z
  .enum(["STRIPE", "FORTNOX"])
  .describe("STRIPE: Stripe Invoicing on the organization's account. FORTNOX: its Fortnox company");

/** How the organization takes order money (ADR 0090): the deposit rule and the invoice provider. */
export const PaymentSettingsSchema = z.object({
  id: z.string().nullable().describe("Null until the settings are first saved"),
  depositPercent: z
    .number()
    .int()
    .nullable()
    .describe("Share of the order's total incl. VAT asked as a deposit, 1–100; null = no rule"),
  depositMinimumMinor: z
    .number()
    .int()
    .nullable()
    .describe(
      "Minor units: an order whose total incl. VAT is below this is paid in full up front " +
        "instead of by deposit; null = no minimum",
    ),
  invoiceProvider: InvoiceProviderSchema.nullable().describe(
    "Where invoices are raised when both Stripe and Fortnox are connected; null = whichever is",
  ),
});

export const PaymentSettingsGetInputSchema = z.object({});

/** Omitted fields keep their value; null clears one. */
export const PaymentSettingsUpdateInputSchema = z.object({
  depositPercent: z.number().int().min(1).max(100).nullish(),
  depositMinimumMinor: z.number().int().min(0).max(PAYMENT_AMOUNT_MAX_MINOR).nullish(),
  invoiceProvider: InvoiceProviderSchema.nullish(),
});

export type InvoiceProvider = z.infer<typeof InvoiceProviderSchema>;
export type PaymentSettingsDto = z.infer<typeof PaymentSettingsSchema>;
export type PaymentSettingsUpdateInput = z.infer<typeof PaymentSettingsUpdateInputSchema>;
