import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { listProviders } from "../../providers/registry";
import { IntegrationListInputSchema, IntegrationListOutputSchema } from "./schema";
import { toIntegrationDto } from "./to-integration-dto";

export const listIntegrations = defineOperation({
  name: "integration.list",
  kind: "query",
  description:
    "The organization's connections to outside systems, one per provider Bibi knows (payment " +
    "operators, accounting systems), with status, how it connects (connectKind), what it can do " +
    "(capabilities: payment methods, invoicing) and the connected company's name and " +
    "organization number. Tokens and credentials are never returned.",
  input: IntegrationListInputSchema,
  output: IntegrationListOutputSchema,
  permission: "integration:read",
  entityType: "integrationConnection",
  handler: async ({ context }) => {
    const rows = await context.db.providerConnection.findMany({});
    const { organizationId } = context;
    const providers = listProviders().map((adapter) => adapter.key);
    const items = providers.map((provider) =>
      toIntegrationDto({
        row: rows.find((row) => row.provider === provider) ?? null,
        organizationId,
        provider,
      }),
    );
    return ok({ value: { items } });
  },
});
