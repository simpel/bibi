import type { PaymentProvider } from "./provider";
import { stripePaymentProvider } from "./stripe-provider";

export type * from "./provider";

let current: PaymentProvider = stripePaymentProvider;

export type SetPaymentProviderInput = { provider: PaymentProvider | undefined };

/** Tests swap in `createMemoryPaymentProvider()`; `undefined` restores the Stripe adapter. */
export function setPaymentProvider({ provider }: SetPaymentProviderInput): void {
  current = provider ?? stripePaymentProvider;
}

export function getPaymentProvider(): PaymentProvider {
  return current;
}
