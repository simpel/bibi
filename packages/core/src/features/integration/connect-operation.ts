import { sealSecret } from "../../crypto/secret-box";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { nowOf } from "../../time/now";
import { fortnoxAuthorizeUrl } from "./fortnox/authorize-url";
import { fortnoxCredentials, fortnoxNotConfigured } from "./fortnox/fortnox-config";
import { newOauthStart } from "./oauth-state";
import { IntegrationConnectInputSchema, IntegrationConnectOutputSchema } from "./schema";
import { toIntegrationDto } from "./to-integration-dto";

export const connectIntegration = defineOperation({
  name: "integration.connect",
  kind: "command",
  description:
    "Start connecting the organization to an outside system (Fortnox). Returns the provider's " +
    "consent page (`authorizeUrl`, valid 10 minutes) to open in a browser signed in to Bibi; " +
    "Fortnox requires a Fortnox system administrator to approve. A CONNECTED connection keeps " +
    "working until the new approval replaces it.",
  input: IntegrationConnectInputSchema,
  output: IntegrationConnectOutputSchema,
  permission: "integration:write",
  entityType: "integrationConnection",
  handler: async ({ input, context }) => {
    const credentials = fortnoxCredentials();
    if (!credentials) return fortnoxNotConfigured();
    const start = newOauthStart();
    const verifier = sealSecret({ plain: start.codeVerifier });
    if (!verifier.ok) return verifier;
    const { provider } = input;
    const pending = {
      oauthStateHash: start.stateHash,
      codeVerifierSealed: verifier.value,
      oauthStartedAt: nowOf({ context }),
    };
    const before = await context.db.integrationConnection.findFirst({ where: { provider } });
    const row = before
      ? await context.db.integrationConnection.update({
          where: { id: before.id },
          data: { ...pending, ...(before.status === "CONNECTED" ? {} : { status: "PENDING" }) },
        })
      : await context.db.integrationConnection.create({
          data: { organizationId: context.organizationId, provider, ...pending },
        });
    const { organizationId } = context;
    const dto = toIntegrationDto({ row, organizationId, provider });
    context.recordChange({
      entityId: row.id,
      ...(before ? { before: toIntegrationDto({ row: before, organizationId, provider }) } : {}),
      after: dto,
    });
    const authorizeUrl = fortnoxAuthorizeUrl({
      clientId: credentials.clientId,
      state: start.state,
      codeChallenge: start.codeChallenge,
    });
    return ok({ value: { ...dto, authorizeUrl } });
  },
});
