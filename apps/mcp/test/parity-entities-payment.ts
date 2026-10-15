import {
  createMemoryPaymentProvider,
  ok,
  setPaymentProvider,
  setStripeConnectGateway,
} from "@okazi/core";
import { createId } from "@paralleldrive/cuid2";
import { byId, type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

/** Stripe stand-in: the account is created through the real operation, only Stripe is faked. */
function installFakeStripe({ status = "ONBOARDING" }: { status?: "ONBOARDING" | "ACTIVE" } = {}) {
  setStripeConnectGateway({
    gateway: {
      createAccount: async () => ok({ value: { stripeAccountId: `acct_${createId()}` } }),
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

/** A card payment on the booking: the account is synced to ACTIVE and the PSP kept in memory. */
export function paymentEntity(): ParityEntity {
  const reads = byId({
    name: "payment",
    field: "payment",
    list: "payments",
    createTool: "payment_create",
    args: {},
  });
  return {
    ...reads,
    create: async ({ mcp, made }) => {
      installFakeStripe({ status: "ACTIVE" });
      setPaymentProvider({ provider: createMemoryPaymentProvider() });
      await tool({ mcp, name: "paymentAccount_sync", args: {} });
      const args = { bookingId: made.booking.id, method: "CARD", amountMinor: 50_000 };
      return tool({ mcp, name: "payment_create", args });
    },
  };
}
