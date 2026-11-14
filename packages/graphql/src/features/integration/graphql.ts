import {
  checkIntegrationSetup,
  connectIntegration,
  disconnectIntegration,
  type IntegrationConnectionDto,
  IntegrationConnectionSchema,
  type IntegrationConnectOutput,
  IntegrationConnectOutputSchema,
  listIntegrations,
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

fieldFromOperation({ operation: listIntegrations, type: IntegrationListRef, name: "integrations" });
mutationFromOperation({ operation: connectIntegration, type: IntegrationConnectStartRef });
mutationFromOperation({ operation: checkIntegrationSetup, type: IntegrationConnectionRef });
mutationFromOperation({ operation: disconnectIntegration, type: IntegrationConnectionRef });
