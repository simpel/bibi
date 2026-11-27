import {
  BAS_ACCOUNTS,
  createMemoryProvider,
  type ExecuteContext,
  execute,
  type MemoryProvider,
  setProviderAdapter,
  updatePaymentSettings,
} from "@bibi/core";

/**
 * An accounting system in Visma's place (ADR 0106): a memory ledger that raises invoices and
 * books payments taken elsewhere, with a BAS chart and Deposits and Default revenue mapped, CONNECTED and chosen for INVOICE, since money needs one.
 * `resetProviderAdapters` undoes the adapter.
 */
export async function connectLedger({
  context,
}: {
  context: ExecuteContext;
}): Promise<MemoryProvider> {
  const fake = createMemoryProvider({
    key: "VISMA",
    connectKind: "HOSTED_ONBOARDING",
    invoicing: true,
    ledger: true,
    registerPayment: true,
    accounts: BAS_ACCOUNTS,
  });
  setProviderAdapter({ key: "VISMA", adapter: fake.adapter });
  const existing = await context.db.providerConnection.findFirst({
    where: { provider: "VISMA" },
    select: { id: true },
  });
  if (existing) return fake;
  const connection = await context.db.providerConnection.create({
    data: {
      organizationId: context.organizationId,
      provider: "VISMA",
      status: "CONNECTED",
      externalAccountId: `ledger-${context.organizationId}`,
      connectedAt: new Date(),
    },
  });
  // Deposits and Default revenue must be mapped before money can be booked (ADR 0123).
  const mapped = [
    { purpose: "ADVANCES" as const, providerAccount: "2421" },
    { purpose: "REVENUE_DEFAULT" as const, providerAccount: "3001" },
  ];
  for (const { purpose, providerAccount } of mapped) {
    await context.db.accountMapping.create({
      data: {
        organizationId: context.organizationId,
        connectionId: connection.id,
        purpose,
        providerAccount,
      },
    });
  }
  const routes = [{ method: "INVOICE" as const, provider: "VISMA" as const }];
  const routed = await execute({ operation: updatePaymentSettings, input: { routes }, context });
  if (!routed.ok) throw new Error(routed.error.message);
  return fake;
}
