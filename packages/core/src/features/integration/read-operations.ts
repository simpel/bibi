import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import {
  IntegrationListInputSchema,
  IntegrationListOutputSchema,
  IntegrationProviderSchema,
} from "./schema";
import { toIntegrationDto } from "./to-integration-dto";

export const listIntegrations = defineOperation({
  name: "integration.list",
  kind: "query",
  description:
    "The organization's connections to outside systems (Fortnox), one per provider, with status " +
    "and the connected company's name and organization number. Tokens are never returned.",
  input: IntegrationListInputSchema,
  output: IntegrationListOutputSchema,
  permission: "integration:read",
  entityType: "integrationConnection",
  handler: async ({ context }) => {
    const rows = await context.db.integrationConnection.findMany({});
    const { organizationId } = context;
    const items = IntegrationProviderSchema.options.map((provider) =>
      toIntegrationDto({
        row: rows.find((row) => row.provider === provider) ?? null,
        organizationId,
        provider,
      }),
    );
    return ok({ value: { items } });
  },
});
