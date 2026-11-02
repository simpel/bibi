import { getPaymentAccount } from "./read-operations";
import { getPaymentSettings, updatePaymentSettings } from "./settings-operations";
import { startPaymentOnboarding, syncPaymentAccount } from "./write-operations";

export {
  getPaymentAccount,
  getPaymentSettings,
  startPaymentOnboarding,
  syncPaymentAccount,
  updatePaymentSettings,
};

/** Stripe Connect payout account and payment settings per organization (ADR 0028, 0090). */
export const paymentAccountOperations = [
  getPaymentAccount,
  startPaymentOnboarding,
  syncPaymentAccount,
  getPaymentSettings,
  updatePaymentSettings,
];
