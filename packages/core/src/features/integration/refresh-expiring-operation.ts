import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { ExternalInput, OperationContext } from "../../operations/types";
import { nowOf } from "../../time/now";
import { refreshFortnoxConnection } from "./fortnox/refresh-connection";
import {
  IntegrationRefreshExpiringInputSchema,
  type IntegrationRefreshExpiringOutput,
  IntegrationRefreshExpiringOutputSchema,
} from "./schema";

/** Refresh connections whose refresh token has less than this left (45-day lifetime). */
const REFRESH_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

const dueConnections = ({ context }: { context: Pick<OperationContext, "db" | "now"> }) =>
  context.db.integrationConnection.findMany({
    where: {
      provider: "FORTNOX",
      status: "CONNECTED",
      refreshExpiresAt: { lt: new Date(nowOf({ context }).getTime() + REFRESH_WINDOW_MS) },
    },
  });

/** The refreshes, after the commit: a rotated refresh token must never be rolled back (ADR 0058). */
async function refreshAfterCommit({
  output,
  context,
}: ExternalInput<unknown, IntegrationRefreshExpiringOutput>): Promise<
  Result<IntegrationRefreshExpiringOutput>
> {
  const result = { ...output, refreshed: 0, expired: 0 };
  for (const row of await dueConnections({ context })) {
    const refreshed = await refreshFortnoxConnection({ context, row });
    if (refreshed.ok) result.refreshed++;
    else if (refreshed.error.code === "CONFLICT") result.expired++;
    else return refreshed;
  }
  return ok({ value: result });
}

/**
 * Keeps idle connections alive (ADR 0087): Fortnox refresh tokens die 45 days after issue and API
 * calls do not extend them. SYSTEM only (the worker's daily job); not registered on any surface.
 */
export const refreshExpiringIntegrations = defineOperation({
  name: "integration.refreshExpiring",
  kind: "command",
  description: "Refresh connections whose refresh token expires within 14 days (worker only).",
  input: IntegrationRefreshExpiringInputSchema,
  output: IntegrationRefreshExpiringOutputSchema,
  permission: "integration:write",
  entityType: "integrationConnection",
  approval: false,
  aiAllowed: false,
  handler: async ({ context }) => {
    if (context.actor.type !== "system") {
      const message = "Connections are refreshed by the worker only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const due = (await dueConnections({ context })).length;
    return ok({ value: { due, refreshed: 0, expired: 0 } });
  },
  external: refreshAfterCommit,
});
