import { getLogger } from "@bibi/logger";
import { openSecret } from "../../crypto/secret-box";
import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { ExternalInput } from "../../operations/types";
import { getFortnoxGateway } from "./fortnox/gateway-registry";
import {
  type IntegrationConnectionDto,
  IntegrationConnectionSchema,
  type IntegrationDisconnectInput,
  IntegrationDisconnectInputSchema,
} from "./schema";
import { toIntegrationDto } from "./to-integration-dto";

/**
 * After the commit (ADR 0058): revoke the refresh token at Fortnox, then clear the sealed tokens.
 * A failed revoke is logged and the tokens are cleared anyway, so Bibi keeps no secret.
 */
async function revokeAfterCommit({
  input,
  output,
  context,
}: ExternalInput<IntegrationDisconnectInput, IntegrationConnectionDto>): Promise<
  Result<IntegrationConnectionDto>
> {
  const { provider } = input;
  const row = await context.db.integrationConnection.findFirst({ where: { provider } });
  if (!row?.refreshTokenSealed) return ok({ value: output });
  const refreshToken = openSecret({ sealed: row.refreshTokenSealed });
  const revoked = refreshToken.ok
    ? await getFortnoxGateway().revoke({ refreshToken: refreshToken.value })
    : refreshToken;
  if (!revoked.ok) {
    getLogger().warn({ event: "integration.revokeFailed", provider, err: revoked.error });
  }
  await context.db.integrationConnection.update({
    where: { id: row.id },
    data: { accessTokenSealed: null, refreshTokenSealed: null, accessExpiresAt: null },
  });
  return ok({ value: output });
}

export const disconnectIntegration = defineOperation({
  name: "integration.disconnect",
  kind: "command",
  description:
    "Disconnect the organization from an outside system (Fortnox): revokes Bibi's access at the " +
    "provider and forgets the tokens. Reconnecting needs a new approval at the provider.",
  input: IntegrationDisconnectInputSchema,
  output: IntegrationConnectionSchema,
  permission: "integration:write",
  entityType: "integrationConnection",
  handler: async ({ input, context }) => {
    const { provider } = input;
    const { organizationId } = context;
    const before = await context.db.integrationConnection.findFirst({ where: { provider } });
    if (!before || before.status === "DISCONNECTED") {
      return ok({ value: toIntegrationDto({ row: before, organizationId, provider }) });
    }
    const row = await context.db.integrationConnection.update({
      where: { id: before.id },
      data: {
        status: "DISCONNECTED",
        oauthStateHash: null,
        codeVerifierSealed: null,
        oauthStartedAt: null,
      },
    });
    const after = toIntegrationDto({ row, organizationId, provider });
    const beforeDto = toIntegrationDto({ row: before, organizationId, provider });
    context.recordChange({ entityId: row.id, before: beforeDto, after });
    return ok({ value: after });
  },
  external: revokeAfterCommit,
});
