import { createId } from "@paralleldrive/cuid2";
import { ok, type StripeConnectGateway, setStripeConnectGateway } from "../src/index";

export type FakeGateway = StripeConnectGateway & {
  calls: string[];
  accountStatus: "ONBOARDING" | "ACTIVE" | "RESTRICTED";
};

/** Installs an in-memory Stripe Connect gateway; call `setStripeConnectGateway` with undefined to undo. */
export function installFakeGateway(): FakeGateway {
  const fake: FakeGateway = {
    calls: [],
    accountStatus: "ONBOARDING",
    async createAccount() {
      fake.calls.push("createAccount");
      return ok({ value: { stripeAccountId: `acct_${createId()}` } });
    },
    async getAccountStatus() {
      fake.calls.push("getAccountStatus");
      return ok({ value: { status: fake.accountStatus } });
    },
    async createOnboardingLink({ stripeAccountId }) {
      fake.calls.push("createOnboardingLink");
      return ok({
        value: {
          url: `https://connect.stripe.test/setup/${stripeAccountId}`,
          expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
      });
    },
  };
  setStripeConnectGateway({ gateway: fake });
  return fake;
}
