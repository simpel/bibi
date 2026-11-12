import { installFakeStripe } from "./fake-stripe";
import { connectLedger } from "./ledger";
import { byId, type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

const LINE =
  "id lineId itemId position name quantity unitPriceMinor priceUnit discountPercent vatRatePercent " +
  "tags totalExclVatMinor vatMinor vatRows parentLineId role alternativeGroupId alternativeGroupName " +
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

/**
 * How order money is taken (ADR 0090): the deposit rule and the routes, with the memory
 * accounting system money needs (ADR 0106) taking invoices.
 */
export const paymentSettingsEntity: ParityEntity = {
  name: "paymentSettings",
  create: async ({ mcp, context }) => {
    await connectLedger({ context });
    return tool({
      mcp,
      name: "paymentSettings_update",
      args: {
        depositPercent: 30,
        depositMinimumMinor: 500_000,
        invoiceProvider: "VISMA",
        paymentOperator: "STRIPE",
      },
    });
  },
  viaMcp: ({ mcp }) => tool({ mcp, name: "paymentSettings_get", args: {} }),
  viaRest: ({ context }) => createRestClient({ context }).get({ path: "/payment-settings" }),
  viaGraph: async ({ context, keys }) => {
    const query = `query { paymentSettings { ${keys.join(" ")} } }`;
    return (await gqlQuery({ context, query, variables: {} })).paymentSettings;
  },
};

/** A SENT deposit request (ADR 0057) on the order made earlier. */
export const depositEntity = (): ParityEntity => ({
  ...byId({ name: "deposit", field: "deposit", list: "deposits", createTool: "", args: {} }),
  create: async ({ mcp, made }) => {
    const args = { orderId: made.order.id, description: "Parity advance", amountMinor: 100_000 };
    const draft = await tool({ mcp, name: "deposit_create", args });
    return tool({ mcp, name: "deposit_send", args: { id: draft.id } });
  },
});

/** An invoice of the order's priced lines (ADR 0052), once its status is invoiceable. */
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
    const orderStatus = { id: made.order.statusId, invoiceable: true };
    await tool({ mcp, name: "orderStatus_update", args: orderStatus });
    return tool({ mcp, name: "invoice_create", args: { orderId: made.order.id } });
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
      await tool({ mcp, name: "paymentAccount_sync", args: {} });
      const args = { depositId: made.deposit.id, method: "CARD", amountMinor: 50_000 };
      return tool({ mcp, name: "payment_create", args });
    },
  };
}

/** The accounts (ADR 0077), with one item type mapped to its own account. */
export const accountingSettingsEntity: ParityEntity = {
  name: "accountingSettings",
  create: async ({ mcp }) => {
    const type = await tool({
      mcp,
      name: "entityType_create",
      args: { base: "ITEM", name: "Parity rooms", capabilities: ["PRICED"] },
    });
    const revenueAccounts = [{ entityTypeId: type.id, itemId: null, account: "3041" }];
    const args = { revenueAccount: "3002", fiscalYearStartMonth: 7, revenueAccounts };
    return tool({ mcp, name: "accountingSettings_update", args });
  },
  viaMcp: ({ mcp }) => tool({ mcp, name: "accountingSettings_get", args: {} }),
  viaRest: ({ context }) => createRestClient({ context }).get({ path: "/accounting-settings" }),
  viaGraph: async ({ context, keys }) => {
    const fields = keys.map((key) =>
      key === "revenueAccounts" ? "revenueAccounts { entityTypeId itemId account }" : key,
    );
    const query = `query { accountingSettings { ${fields.join(" ")} } }`;
    return (await gqlQuery({ context, query, variables: {} })).accountingSettings;
  },
};

/** A credit note of the invoice, once sent and raised in the accounting system (ADR 0100). */
export const creditNoteEntity = (): ParityEntity => ({
  ...byId({
    name: "creditNote",
    field: "creditNote",
    list: "credit-notes",
    createTool: "",
    args: {},
    nested: { lines: `{ ${LINE} }` },
  }),
  create: async ({ mcp, made }) => {
    await tool({ mcp, name: "invoice_send", args: { id: made.invoice.id } });
    const args = { invoiceId: made.invoice.id, amountMinor: 10_000, reason: "Parity" };
    await tool({ mcp, name: "invoice_credit", args });
    const page = await tool({ mcp, name: "creditNote_list", args: { invoiceId: made.invoice.id } });
    return page.items[0];
  },
});

/** Money entities in creation order: account, receivables, then a payment against one. */
export const moneyEntities = (): ParityEntity[] => [
  paymentAccountEntity,
  paymentSettingsEntity,
  depositEntity(),
  invoiceEntity(),
  paymentEntity(),
  accountingSettingsEntity,
  creditNoteEntity(),
];
