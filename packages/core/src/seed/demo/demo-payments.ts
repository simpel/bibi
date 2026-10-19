import { ok, type Result } from "../../errors/result";
import { createMemoryPaymentProvider } from "../../features/payment/memory-provider";
import { getPaymentProvider, setPaymentProvider } from "../../features/payment/provider-registry";
import type { StripeConnectGateway } from "../../features/payment-account/gateway";
import {
  getStripeConnectGateway,
  setStripeConnectGateway,
} from "../../features/payment-account/gateway-registry";

/**
 * Stripe Connect as the demo seed sees it: every organization's connected account is ACTIVE at
 * once, so payments can be requested without real onboarding. Never used outside the seed.
 */
const demoConnectGateway: StripeConnectGateway = {
  createAccount: async ({ organizationId }) =>
    ok({ value: { stripeAccountId: `acct_demo_${organizationId}` } }),
  getAccountStatus: async () => ok({ value: { status: "ACTIVE" } }),
  createOnboardingLink: async () =>
    ok({ value: { url: "https://connect.stripe.test/demo", expiresAt: new Date() } }),
};

export type WithDemoPaymentsInput<T> = { run: () => Promise<Result<T>> };

/**
 * Runs `run` with the demo Connect gateway and the memory payment provider (no Stripe calls),
 * then restores what was installed before.
 */
export async function withDemoPayments<T>({ run }: WithDemoPaymentsInput<T>): Promise<Result<T>> {
  const gateway = getStripeConnectGateway();
  const provider = getPaymentProvider();
  setStripeConnectGateway({ gateway: demoConnectGateway });
  setPaymentProvider({ provider: createMemoryPaymentProvider() });
  try {
    return await run();
  } finally {
    setStripeConnectGateway({ gateway });
    setPaymentProvider({ provider });
  }
}
