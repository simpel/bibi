import {
  BAS_ACCOUNTS,
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
    accounts: BAS_ACCOUNTS,
  });
  setProviderAdapter({ key: "VISMA", adapter: fake.adapter });
  const connection = await context.db.providerConnection.upsert({
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
  // Deposits and Default revenue mapped, as a connect on a BAS chart does (ADR 0123).
  const mapped = await context.db.accountMapping.count({ where: { connectionId: connection.id } });
  if (mapped === 0) {
    for (const [purpose, providerAccount] of [
      ["ADVANCES", "2420"],
      ["REVENUE_DEFAULT", "3001"],
    ] as const) {
      await context.db.accountMapping.create({
        data: {
          organizationId: context.organizationId,
          connectionId: connection.id,
          purpose,
          entityTypeId: null,
          providerAccount,
        },
      });
    }
  }
  const routes = [{ method: "INVOICE" as const, provider: "VISMA" as const }];
  unwrap({
    result: await execute({ operation: updatePaymentSettings, input: { routes }, context }),
  });
  return fake;
}
