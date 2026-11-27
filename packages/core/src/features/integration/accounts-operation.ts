import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict } from "../../shared/errors";
import { parseChart } from "./chart";
import { IntegrationAccountsInputSchema, IntegrationAccountsSchema } from "./schema";

export const listIntegrationAccounts = defineOperation({
  name: "integration.accounts",
  kind: "query",
  description:
    "The connected accounting system's accounts as last read (integration.syncAccounts): what a " +
    "purpose can be mapped to. Fortnox: the chart of accounts. Spiris: coding families with the " +
    "VAT rates each has a coding for. `readable` false means the system refused the list " +
    "(reconnect it).",
  input: IntegrationAccountsInputSchema,
  output: IntegrationAccountsSchema,
  permission: "integration:read",
  entityType: "integrationConnection",
  handler: async ({ input, context }) => {
    const { provider } = input;
    const row = await context.db.providerConnection.findFirst({ where: { provider } });
    if (!row || row.disconnectedAt) return conflict({ message: `${provider} is not connected` });
    const chart = parseChart({ value: row.chart });
    return ok({
      value: {
        provider,
        syncedAt: row.chartSyncedAt,
        readable: chart?.readable ?? true,
        accounts: chart?.accounts ?? [],
      },
    });
  },
});
