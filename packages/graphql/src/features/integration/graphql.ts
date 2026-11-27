import {
  connectIntegration,
  disconnectIntegration,
  type IntegrationAccountsDto,
  IntegrationAccountsSchema,
  type IntegrationConnectionDto,
  IntegrationConnectionSchema,
  type IntegrationConnectOutput,
  IntegrationConnectOutputSchema,
  listIntegrationAccounts,
  listIntegrations,
  syncIntegrationAccounts,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

export const IntegrationConnectionRef = objectFromSchema<IntegrationConnectionDto>({
  name: "IntegrationConnection",
  schema: IntegrationConnectionSchema,
  omit: ["organizationId"],
  description:
    "The organization's connection to an outside system (Fortnox); NOT_CONNECTED until started.",
});
const IntegrationConnectStartRef = objectFromSchema<IntegrationConnectOutput>({
  name: "IntegrationConnectStart",
  schema: IntegrationConnectOutputSchema,
  omit: ["organizationId"],
  description: "The connection plus the provider's consent page to open in a browser.",
});
const IntegrationListRef = builder
  .objectRef<{ items: IntegrationConnectionDto[] }>("IntegrationConnectionList")
  .implement({
    description: "One connection per provider.",
    fields: (t) => ({
      items: t.field({ type: [IntegrationConnectionRef], resolve: (list) => list.items }),
    }),
  });

const IntegrationAccountsRef = objectFromSchema<IntegrationAccountsDto>({
  name: "IntegrationAccounts",
  schema: IntegrationAccountsSchema,
  description: "The accounts read from the connected accounting system, as of the last sync.",
});

fieldFromOperation({
  operation: listIntegrationAccounts,
  type: IntegrationAccountsRef,
  name: "integrationAccounts",
});
fieldFromOperation({ operation: listIntegrations, type: IntegrationListRef, name: "integrations" });
mutationFromOperation({ operation: connectIntegration, type: IntegrationConnectStartRef });
mutationFromOperation({ operation: syncIntegrationAccounts, type: IntegrationConnectionRef });
mutationFromOperation({ operation: disconnectIntegration, type: IntegrationConnectionRef });
