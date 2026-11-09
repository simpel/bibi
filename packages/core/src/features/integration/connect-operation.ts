import { sealSecret } from "../../crypto/secret-box";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { newOauthStart } from "../../providers/oauth/oauth-state";
import { nowOf } from "../../time/now";
import { configuredOauthPort } from "./oauth-provider";
import { IntegrationConnectInputSchema, IntegrationConnectOutputSchema } from "./schema";
import { toIntegrationDto } from "./to-integration-dto";

export const connectIntegration = defineOperation({
  name: "integration.connect",
  kind: "command",
  description:
    "Start connecting the organization to an outside system (one integration.list names, e.g. " +
    "Fortnox). Returns the provider's consent page (`authorizeUrl`, valid 10 minutes) to open " +
    "in a browser signed in to Bibi; Fortnox requires a Fortnox system administrator to " +
    "approve. A CONNECTED connection keeps working until the new approval replaces it.",
  input: IntegrationConnectInputSchema,
  output: IntegrationConnectOutputSchema,
  permission: "integration:write",
  entityType: "integrationConnection",
  handler: async ({ input, context }) => {
    const port = configuredOauthPort({ provider: input.provider });
    if (!port.ok) return port;
    const start = newOauthStart();
    const verifier = sealSecret({ plain: start.codeVerifier });
    if (!verifier.ok) return verifier;
    const { provider } = input;
    const pending = {
      oauthStateHash: start.stateHash,
      codeVerifierSealed: verifier.value,
      oauthStartedAt: nowOf({ context }),
    };
    const before = await context.db.providerConnection.findFirst({ where: { provider } });
    const row = before
      ? await context.db.providerConnection.update({
          where: { id: before.id },
          data: { ...pending, ...(before.status === "CONNECTED" ? {} : { status: "PENDING" }) },
        })
      : await context.db.providerConnection.create({
          data: { organizationId: context.organizationId, provider, ...pending },
        });
    const { organizationId } = context;
    const dto = toIntegrationDto({ row, organizationId, provider });
    context.recordChange({
      entityId: row.id,
      ...(before ? { before: toIntegrationDto({ row: before, organizationId, provider }) } : {}),
      after: dto,
    });
    const authorizeUrl = port.value.authorizeUrl({
      state: start.state,
      codeChallenge: start.codeChallenge,
    });
    return ok({ value: { ...dto, authorizeUrl } });
  },
});
