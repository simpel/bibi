import type { ProviderConnection } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import type { ProviderKey } from "../provider-keys";

/** Inside an operation `recordChange` audits the EXPIRED change; outside one there is no audit row. */
export type OauthContext = Pick<OperationContext, "db" | "organizationId" | "now"> &
  Partial<Pick<OperationContext, "recordChange">>;

export type OauthAccessInput = { context: OauthContext; provider: ProviderKey };
export type OauthRowInput = { context: OauthContext; row: ProviderConnection };

export const providerNotConnected = ({ provider }: { provider: string }) =>
  conflict({
    message: `${provider} is not connected. An admin connects it in Settings → Integrations.`,
  });

/** What the audit row shows of a connection: never a token. */
const auditImage = ({ row }: { row: ProviderConnection }) => ({
  id: row.id,
  provider: row.provider,
  status: row.status,
});

/** The provider refused the stored refresh token: the grant is gone and an admin must reconnect. */
export async function markConnectionExpired({ context, row }: OauthRowInput) {
  const expired = await context.db.providerConnection.update({
    where: { id: row.id },
    data: {
      status: "EXPIRED",
      accessTokenSealed: null,
      refreshTokenSealed: null,
      refreshClaimedAt: null,
    },
  });
  context.recordChange?.({
    entityId: row.id,
    before: auditImage({ row }),
    after: auditImage({ row: expired }),
  });
  const { provider } = row;
  return conflict({ message: `${provider} refused the connection. An admin must reconnect.` });
}
