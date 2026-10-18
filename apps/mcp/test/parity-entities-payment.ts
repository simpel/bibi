import { createMemoryPaymentProvider, setPaymentProvider } from "@okazi/core";
import { installFakeStripe } from "./fake-stripe";
import { byId, type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

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

/** A card payment on the ticket: the account is synced to ACTIVE and the PSP kept in memory. */
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
      const args = { ticketId: made.ticket.id, method: "CARD", amountMinor: 50_000 };
      return tool({ mcp, name: "payment_create", args });
    },
  };
}
