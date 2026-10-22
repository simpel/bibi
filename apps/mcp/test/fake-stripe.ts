import { ok, setStripeConnectGateway } from "@bibi/core";
import { createId } from "@paralleldrive/cuid2";

/** Stripe stand-in: the account is created through the real operation, only Stripe is faked. */
export function installFakeStripe({
  status = "ONBOARDING",
  onCreateAccount,
}: {
  status?: "ONBOARDING" | "ACTIVE";
  onCreateAccount?: () => void;
} = {}) {
  setStripeConnectGateway({
    gateway: {
      createAccount: async () => {
        onCreateAccount?.();
        return ok({ value: { stripeAccountId: `acct_${createId()}` } });
      },
      getAccountStatus: async () => ok({ value: { status } }),
      createOnboardingLink: async ({ stripeAccountId }) =>
        ok({
          value: {
            url: `https://connect.stripe.test/${stripeAccountId}`,
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
          },
        }),
    },
  });
}
