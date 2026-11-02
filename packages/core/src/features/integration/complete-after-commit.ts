import type { IntegrationConnection } from "@bibi/db";
import { openSecret } from "../../crypto/secret-box";
import { ok, type Result } from "../../errors/result";
import type { ExternalInput } from "../../operations/types";
import { nowOf } from "../../time/now";
import { fortnoxRedirectUri } from "./fortnox/fortnox-config";
import { getFortnoxGateway } from "./fortnox/gateway-registry";
import { toTokenData } from "./fortnox/token-data";
import { findPendingAuthorization, staleAuthorization } from "./pending-authorization";
import type { IntegrationCompleteConnectInput, IntegrationConnectionDto } from "./schema";
import { toIntegrationDto } from "./to-integration-dto";

type CompleteInput = ExternalInput<IntegrationCompleteConnectInput, IntegrationConnectionDto>;

const CLEARED_STATE = { oauthStateHash: null, codeVerifierSealed: null, oauthStartedAt: null };

/** Exchanges the code and reads the Fortnox company; returns the columns to store. */
async function fetchConnection({
  row,
  input,
  context,
}: CompleteInput & { row: IntegrationConnection }) {
  const verifier = openSecret({ sealed: row.codeVerifierSealed ?? "" });
  if (!verifier.ok) return verifier;
  const gateway = getFortnoxGateway();
  const tokens = await gateway.exchangeCode({
    code: input.code,
    codeVerifier: verifier.value,
    redirectUri: fortnoxRedirectUri(),
  });
  if (!tokens.ok) return tokens;
  const company = await gateway.getCompany({ accessToken: tokens.value.accessToken });
  if (!company.ok) return company;
  const data = toTokenData({ tokens: tokens.value, now: nowOf({ context }) });
  if (!data.ok) return data;
  return ok({
    value: {
      ...data.value,
      externalCompanyName: company.value.name,
      externalOrgNumber: company.value.organizationNumber,
      externalTenantId: company.value.databaseNumber,
    },
  });
}

/**
 * `integration.completeConnect` after the commit (ADR 0058, 0087): the state is checked again,
 * cleared whatever happens (a code is single use), and on success the sealed tokens and the
 * company snapshot are stored and the connection is CONNECTED.
 */
export async function completeAfterCommit({
  input,
  output,
  context,
}: CompleteInput): Promise<Result<IntegrationConnectionDto>> {
  const row = await findPendingAuthorization({ input, context });
  if (!row) return staleAuthorization();
  const fetched = await fetchConnection({ input, output, context, row });
  if (!fetched.ok) {
    await context.db.integrationConnection.update({ where: { id: row.id }, data: CLEARED_STATE });
    return fetched;
  }
  const connected = await context.db.integrationConnection.update({
    where: { id: row.id },
    data: {
      ...fetched.value,
      ...CLEARED_STATE,
      status: "CONNECTED",
      connectedAt: nowOf({ context }),
      connectedBy: context.actor.userId,
    },
  });
  const { organizationId } = context;
  const { provider } = input;
  const after = toIntegrationDto({ row: connected, organizationId, provider });
  context.recordChange({
    entityId: row.id,
    before: toIntegrationDto({ row, organizationId, provider }),
    after,
  });
  return ok({ value: after });
}
