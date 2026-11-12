import {
  createMemoryProvider,
  type ExecuteContext,
  execute,
  type MemoryProvider,
  setProviderAdapter,
  updatePaymentSettings,
} from "@bibi/core";

/**
 * An accounting system in Visma's place (ADR 0106): a memory ledger that raises invoices and
 * books payments taken elsewhere, CONNECTED and chosen for INVOICE, since money needs one.
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
  });
  setProviderAdapter({ key: "VISMA", adapter: fake.adapter });
  await context.db.providerConnection.create({
    data: {
      organizationId: context.organizationId,
      provider: "VISMA",
      status: "CONNECTED",
      externalAccountId: `ledger-${context.organizationId}`,
      connectedAt: new Date(),
    },
  });
  const routes = [{ method: "INVOICE" as const, provider: "VISMA" as const }];
  const routed = await execute({ operation: updatePaymentSettings, input: { routes }, context });
  if (!routed.ok) throw new Error(routed.error.message);
  return fake;
}
