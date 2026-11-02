import type { IntegrationConnection } from "@bibi/db";
import type { OperationContext } from "../../../operations/types";
import { conflict } from "../../../shared/errors";
import { toIntegrationDto } from "../to-integration-dto";

/** Inside an operation `recordChange` audits the EXPIRED change; outside one there is no audit row. */
export type FortnoxContext = Pick<OperationContext, "db" | "organizationId" | "now"> &
  Partial<Pick<OperationContext, "recordChange">>;

export type FortnoxAccessInput = { context: FortnoxContext };
export type FortnoxRowInput = FortnoxAccessInput & { row: IntegrationConnection };

export const fortnoxNotConnected = () =>
  conflict({
    message: "Fortnox is not connected. An admin connects it in Settings → Integrations.",
  });

/** Fortnox refused the stored refresh token: the grant is gone and an admin must reconnect. */
export async function markFortnoxExpired({ context, row }: FortnoxRowInput) {
  const expired = await context.db.integrationConnection.update({
    where: { id: row.id },
    data: {
      status: "EXPIRED",
      accessTokenSealed: null,
      refreshTokenSealed: null,
      refreshClaimedAt: null,
    },
  });
  const { organizationId } = context;
  context.recordChange?.({
    entityId: row.id,
    before: toIntegrationDto({ row, organizationId, provider: "FORTNOX" }),
    after: toIntegrationDto({ row: expired, organizationId, provider: "FORTNOX" }),
  });
  return conflict({ message: "Fortnox refused the connection. An admin must reconnect Fortnox." });
}
