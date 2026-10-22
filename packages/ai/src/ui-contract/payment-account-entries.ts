import { PaymentAccountSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of the payout account as tool results carry it; the link only comes with onboarding. */
export const PaymentAccountWireSchema = PaymentAccountSchema.extend({
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  onboardingUrl: z.string().nullish(),
  onboardingExpiresAt: z.string().nullish(),
});

export type PaymentAccountWire = z.infer<typeof PaymentAccountWireSchema>;

const paymentAccountCard = uiEntry({
  component: "payment-account-card",
  schema: PaymentAccountWireSchema,
  toProps: ({ value }) => ({ account: value }),
});

/** Tool → component for the Stripe Connect payout account (ADR 0028). */
export const PAYMENT_ACCOUNT_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  paymentAccount_get: paymentAccountCard,
  paymentAccount_startOnboarding: paymentAccountCard,
  paymentAccount_sync: paymentAccountCard,
};
