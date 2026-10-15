import { ok, setStripeConnectGateway } from "@okazi/core";
import { createId } from "@paralleldrive/cuid2";
import { type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

/** Stripe stand-in: the account is created through the real operation, only Stripe is faked. */
function installFakeStripe(): void {
  setStripeConnectGateway({
    gateway: {
      createAccount: async () => ok({ value: { stripeAccountId: `acct_${createId()}` } }),
      getAccountStatus: async () => ok({ value: { status: "ONBOARDING" } }),
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

/** The singleton payout account: onboarding creates it, then every surface reads it back. */
export const paymentAccountEntity: ParityEntity = {
  name: "paymentAccount",
  create: async ({ mcp }) => {
    installFakeStripe();
    await tool({ mcp, name: "paymentAccount_startOnboarding", args: {} });
    return tool({ mcp, name: "paymentAccount_get", args: {} });
  },
  viaMcp: ({ mcp }) => tool({ mcp, name: "paymentAccount_get", args: {} }),
  viaRest: ({ context }) => createRestClient({ context }).get({ path: "/payment-account" }),
  viaGraph: async ({ context, keys }) => {
    const query = `query { paymentAccount { ${keys.join(" ")} } }`;
    return (await gqlQuery({ context, query, variables: {} })).paymentAccount;
  },
};
