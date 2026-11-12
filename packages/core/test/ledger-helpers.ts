import {
  createMemoryProvider,
  type ExecuteContext,
  execute,
  type MemoryProvider,
  setProviderAdapter,
  updatePaymentSettings,
} from "../src/index";
import { unwrap } from "./helpers";

export type ConnectLedgerInput = { context: ExecuteContext };

/**
 * An accounting system in Visma's place (ADR 0106): a memory ledger that issues invoices and
 * books payments taken elsewhere, CONNECTED and chosen for INVOICE. `resetProviderAdapters`
 * undoes the adapter.
 */
export async function connectLedger({ context }: ConnectLedgerInput): Promise<MemoryProvider> {
  const fake = createMemoryProvider({
    key: "VISMA",
    connectKind: "HOSTED_ONBOARDING",
    invoicing: true,
    ledger: true,
    registerPayment: true,
  });
  setProviderAdapter({ key: "VISMA", adapter: fake.adapter });
  await context.db.providerConnection.upsert({
    where: {
      organizationId_provider: { organizationId: context.organizationId, provider: "VISMA" },
    },
    create: {
      organizationId: context.organizationId,
      provider: "VISMA",
      status: "CONNECTED",
      externalAccountId: `ledger-${context.organizationId}`,
      connectedAt: new Date(),
    },
    update: { status: "CONNECTED", disconnectedAt: null },
  });
  const routes = [{ method: "INVOICE" as const, provider: "VISMA" as const }];
  unwrap({
    result: await execute({ operation: updatePaymentSettings, input: { routes }, context }),
  });
  return fake;
}
