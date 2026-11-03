import { z } from "zod";
import { BillingAccessStateSchema, BillingIntervalSchema } from "../../features/billing/schema";

/** One thing Bibi sells, from the plan (ADR 0095), and whether its price exists in Stripe yet. */
export const BillingProductSchema = z.object({
  key: z.enum(["baseMonthly", "baseYearly", "seatMonthly"]),
  amountMinor: z.number().int().describe("Excluding VAT"),
  currency: z.string(),
  interval: BillingIntervalSchema,
  inStripe: z.boolean(),
});
export type BillingProductDto = z.infer<typeof BillingProductSchema>;

/** Bibi's billing setup as a superadmin sees it (ADR 0095 §1). Secrets never leave core. */
export const BillingConfigSchema = z.object({
  configured: z.boolean().describe("Key and all three prices are set, so billing is live"),
  secretKeyHint: z.string().nullable().describe("Last four characters of the stored key"),
  livemode: z.boolean(),
  hasWebhookSecret: z.boolean(),
  webhookEndpointId: z.string().nullable(),
  productId: z.string().nullable(),
  basePriceMonthlyId: z.string().nullable(),
  basePriceYearlyId: z.string().nullable(),
  seatPriceId: z.string().nullable(),
  portalConfigId: z.string().nullable(),
  products: z.array(BillingProductSchema),
  includedSeats: z.number().int(),
  trialDays: z.number().int(),
  updatedAt: z.date().nullable(),
  updatedBy: z.string().nullable(),
});
export type BillingConfigDto = z.infer<typeof BillingConfigSchema>;

export const BillingConfigUpdateInputSchema = z.object({
  secretKey: z
    .string()
    .trim()
    .regex(/^(sk|rk)_(test|live)_\w+$/, "A Stripe secret or restricted key (sk_… or rk_…)")
    .optional(),
  webhookSecret: z
    .string()
    .trim()
    .regex(/^whsec_\w+$/, "A webhook signing secret (whsec_…)")
    .optional()
    .describe("Only locally, from stripe listen; on https Bibi creates the webhook itself"),
});
export type BillingConfigUpdateInput = z.infer<typeof BillingConfigUpdateInputSchema>;

/** One organization's billing for the superadmin list. */
export const BillingOrganizationSchema = z.object({
  organizationId: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.date(),
  state: BillingAccessStateSchema,
  trialEndsAt: z.date(),
  exempt: z.boolean(),
  interval: BillingIntervalSchema.nullable(),
  subscriptionStatus: z.string().nullable(),
  extraSeats: z.number().int(),
  stripeCustomerId: z.string().nullable(),
});
export type BillingOrganizationDto = z.infer<typeof BillingOrganizationSchema>;

export const BillingOrganizationListInputSchema = z.object({
  query: z.string().trim().max(200).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});
export const BillingOrganizationListOutputSchema = z.object({
  items: z.array(BillingOrganizationSchema),
  nextCursor: z.string().nullable(),
});

export const BillingOrganizationUpdateInputSchema = z.object({
  organizationId: z.string().min(1),
  exempt: z.boolean().optional().describe("Never asked to pay (pilots, Bibi's own)"),
  trialEndsAt: z.coerce
    .date()
    .nullable()
    .optional()
    .describe("A new trial end; null goes back to 14 days from creation"),
});
export type BillingOrganizationUpdateInput = z.infer<typeof BillingOrganizationUpdateInputSchema>;
