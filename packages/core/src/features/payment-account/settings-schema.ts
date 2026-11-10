import { z } from "zod";
import { PROVIDER_KEYS } from "../../providers/provider-keys";
import { PAYMENT_AMOUNT_MAX_MINOR } from "../payment/schema";

/** The payment methods a provider can be routed to (ADR 0100); MANUAL never goes to one. */
export const ROUTABLE_METHODS = ["CARD", "SWISH", "INVOICE"] as const;

export const ProviderKeySchema = z.enum(PROVIDER_KEYS);

/** One method's route: the provider that takes it, or null for the connected one that can. */
export const PaymentRouteSchema = z.object({
  method: z.enum(ROUTABLE_METHODS),
  provider: ProviderKeySchema.nullable().describe(
    "The provider that takes the method; null = the connected provider that can take it",
  ),
});

/** @deprecated The INVOICE route's provider; use `routes`. */
export const InvoiceProviderSchema = ProviderKeySchema.describe(
  "Where invoices are raised (the INVOICE route); use routes",
);

/** @deprecated The CARD route's provider; use `routes`. */
export const PaymentOperatorSchema = ProviderKeySchema.describe(
  "The provider that takes card payments (the CARD route); use routes",
);

/** How the organization takes order money (ADR 0090, 0100): the deposit rule and the routes. */
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
  routes: z
    .array(PaymentRouteSchema)
    .describe("Which provider takes each payment method (CARD, SWISH, INVOICE), one per method"),
  choices: z
    .array(
      z.object({
        method: z.enum(ROUTABLE_METHODS),
        providers: z.array(ProviderKeySchema).describe("The providers that can take the method"),
      }),
    )
    .describe("Which providers a route may name per method; integration.list says which connect"),
  invoiceProvider: InvoiceProviderSchema.nullable().describe(
    "The INVOICE route's provider (same as in routes); null = whichever is connected",
  ),
  paymentOperator: PaymentOperatorSchema.nullable().describe(
    "The CARD route's provider (same as in routes); null = the one that is connected",
  ),
});

export const PaymentSettingsGetInputSchema = z.object({});

/** Omitted fields keep their value; null clears one. */
export const PaymentSettingsUpdateInputSchema = z.object({
  depositPercent: z.number().int().min(1).max(100).nullish(),
  depositMinimumMinor: z.number().int().min(0).max(PAYMENT_AMOUNT_MAX_MINOR).nullish(),
  routes: z
    .array(PaymentRouteSchema)
    .max(ROUTABLE_METHODS.length)
    .optional()
    .describe(
      "Routes to set; methods not listed keep theirs. The provider must take the method " +
        "(VALIDATION otherwise); a route to a provider that is not connected makes that method " +
        "unavailable until it is (CONFLICT when used).",
    ),
  invoiceProvider: InvoiceProviderSchema.nullish().describe("Same as an INVOICE route"),
  paymentOperator: PaymentOperatorSchema.nullish().describe("Same as a CARD route"),
});

export type PaymentRoute = z.infer<typeof PaymentRouteSchema>;
export type InvoiceProvider = z.infer<typeof InvoiceProviderSchema>;
export type PaymentOperator = z.infer<typeof PaymentOperatorSchema>;
export type PaymentSettingsDto = z.infer<typeof PaymentSettingsSchema>;
export type PaymentSettingsUpdateInput = z.infer<typeof PaymentSettingsUpdateInputSchema>;
