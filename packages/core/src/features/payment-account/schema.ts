import { z } from "zod";

export const PaymentAccountStatusSchema = z.enum([
  "NOT_CONNECTED",
  "ONBOARDING",
  "ACTIVE",
  "RESTRICTED",
]);

/** The organization's payout account. `NOT_CONNECTED` has no row yet, so `id` is null. */
export const PaymentAccountSchema = z.object({
  id: z.string().nullable(),
  organizationId: z.string(),
  status: PaymentAccountStatusSchema,
  stripeAccountId: z.string().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export const PaymentAccountGetInputSchema = z.object({});

export const PaymentAccountStartOnboardingInputSchema = z.object({
  country: z
    .string()
    .length(2)
    .toUpperCase()
    .default("SE")
    .describe("ISO 3166-1 alpha-2 country of the venue's business. Fixed once the account exists."),
  contactEmail: z.email().optional().describe("Contact email Stripe uses for the account."),
});

export const PaymentAccountSyncInputSchema = z.object({});

export const PaymentAccountOnboardingSchema = PaymentAccountSchema.extend({
  onboardingUrl: z
    .url()
    .nullable()
    .describe(
      "Stripe-hosted onboarding page. Short-lived, single use. Null until Stripe is called.",
    ),
  onboardingExpiresAt: z.date().nullable(),
});

export type PaymentAccountStatus = z.infer<typeof PaymentAccountStatusSchema>;
export type PaymentAccountStartOnboardingInput = z.infer<
  typeof PaymentAccountStartOnboardingInputSchema
>;
export type PaymentAccountDto = z.infer<typeof PaymentAccountSchema>;
export type PaymentAccountOnboardingDto = z.infer<typeof PaymentAccountOnboardingSchema>;
