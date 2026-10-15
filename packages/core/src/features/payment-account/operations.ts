import { getPaymentAccount } from "./read-operations";
import { startPaymentOnboarding, syncPaymentAccount } from "./write-operations";

export { getPaymentAccount, startPaymentOnboarding, syncPaymentAccount };

/** Stripe Connect payout account per organization (ADR 0028). */
export const paymentAccountOperations = [
  getPaymentAccount,
  startPaymentOnboarding,
  syncPaymentAccount,
];
