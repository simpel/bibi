import { createMemoryPaymentProvider, setPaymentProvider } from "@bibi/core";
import { installFakeStripe } from "./fake-stripe";
import { byId, type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

const LINE =
  "id lineId itemId position name quantity unitPriceMinor priceUnit discountPercent vatRatePercent " +
  "tags totalExclVatMinor vatMinor vatRows parentLineId alternativeGroupId alternativeGroupName " +
  "alternativeGroupChosen inTotal";

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

/** A SENT deposit request (ADR 0057) on the ticket made earlier. */
export const depositEntity = (): ParityEntity => ({
  ...byId({ name: "deposit", field: "deposit", list: "deposits", createTool: "", args: {} }),
  create: async ({ mcp, made }) => {
    const args = { ticketId: made.ticket.id, description: "Parity advance", amountMinor: 100_000 };
    const draft = await tool({ mcp, name: "deposit_create", args });
    return tool({ mcp, name: "deposit_send", args: { id: draft.id } });
  },
});

/** An invoice of the ticket's priced lines (ADR 0052), once its status is invoiceable. */
export const invoiceEntity = (): ParityEntity => ({
  ...byId({
    name: "invoice",
    field: "invoice",
    list: "invoices",
    createTool: "",
    args: {},
    nested: { lines: `{ ${LINE} }` },
  }),
  create: async ({ mcp, made }) => {
    const ticketStatus = { id: made.ticket.statusId, invoiceable: true };
    await tool({ mcp, name: "ticketStatus_update", args: ticketStatus });
    return tool({ mcp, name: "invoice_create", args: { ticketId: made.ticket.id } });
  },
});

/** A card payment against the deposit: the account is synced to ACTIVE and the PSP in memory. */
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
      const args = { depositId: made.deposit.id, method: "CARD", amountMinor: 50_000 };
      return tool({ mcp, name: "payment_create", args });
    },
  };
}

/** Money entities in creation order: account, receivables, then a payment against one. */
export const moneyEntities = (): ParityEntity[] => [
  paymentAccountEntity,
  depositEntity(),
  invoiceEntity(),
  paymentEntity(),
];
