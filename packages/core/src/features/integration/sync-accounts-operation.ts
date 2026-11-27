import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { ExternalInput } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { loadIntegrationDto } from "./integration-dto";
import {
  type IntegrationConnectionDto,
  IntegrationConnectionSchema,
  type IntegrationSyncAccountsInput,
  IntegrationSyncAccountsInputSchema,
} from "./schema";
import { runSyncAccounts } from "./sync-accounts";
import { toIntegrationDto } from "./to-integration-dto";

type SyncInput = ExternalInput<IntegrationSyncAccountsInput, IntegrationConnectionDto>;

/** After the commit (ADR 0058): reads the system's accounts, then stores them on the connection. */
async function syncAfterCommit({
  input,
  context,
}: SyncInput): Promise<Result<IntegrationConnectionDto>> {
  const { provider } = input;
  const before = await context.db.providerConnection.findFirst({ where: { provider } });
  if (!before) return conflict({ message: `${provider} is not connected` });
  const synced = await runSyncAccounts({ context, row: before });
  if (!synced.ok) return synced;
  const after = await loadIntegrationDto({ context, row: synced.value, provider });
  context.recordChange({
    entityId: before.id,
    before: toIntegrationDto({ row: before, organizationId: context.organizationId, provider }),
    after,
  });
  return ok({ value: after });
}

export const syncIntegrationAccounts = defineOperation({
  name: "integration.syncAccounts",
  kind: "command",
  description:
    "Read the connected accounting system's accounts (Fortnox: the chart of accounts; Spiris: the " +
    "account coding families with the VAT rates each covers) so purposes can be mapped to them " +
    "(accountMapping.set). Reads only; nothing is created or changed there. Run it after adding an " +
    "account or coding in the system; it also runs when a connection is made. The result lists " +
    "setupIssues: what is wrong between the current mappings and those accounts.",
  input: IntegrationSyncAccountsInputSchema,
  output: IntegrationConnectionSchema,
  permission: "integration:write",
  entityType: "integrationConnection",
  handler: async ({ input, context }) => {
    const { provider } = input;
    const row = await context.db.providerConnection.findFirst({ where: { provider } });
    const dto = toIntegrationDto({ row, organizationId: context.organizationId, provider });
    if (dto.status !== "CONNECTED") return conflict({ message: `${provider} is not connected` });
    return ok({ value: dto });
  },
  external: syncAfterCommit,
});
