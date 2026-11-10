import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { ExternalInput, OperationContext } from "../../operations/types";
import { refreshConnection } from "../../providers/oauth/refresh-connection";
import { providersWith } from "../../providers/registry";
import { nowOf } from "../../time/now";
import {
  IntegrationRefreshExpiringInputSchema,
  type IntegrationRefreshExpiringOutput,
  IntegrationRefreshExpiringOutputSchema,
} from "./schema";

/** CONNECTED OAuth connections whose refresh token ends within their provider's window. */
async function dueConnections({ context }: { context: Pick<OperationContext, "db" | "now"> }) {
  const now = nowOf({ context }).getTime();
  const due = [];
  for (const adapter of providersWith({ capability: "OAUTH" })) {
    if (adapter.connect.kind !== "OAUTH") continue;
    const before = new Date(now + adapter.connect.refreshWindowMs);
    due.push(
      ...(await context.db.providerConnection.findMany({
        where: { provider: adapter.key, status: "CONNECTED", refreshExpiresAt: { lt: before } },
      })),
    );
  }
  return due;
}

/** The refreshes, after the commit: a rotated refresh token must never be rolled back (ADR 0058). */
async function refreshAfterCommit({
  output,
  context,
}: ExternalInput<unknown, IntegrationRefreshExpiringOutput>): Promise<
  Result<IntegrationRefreshExpiringOutput>
> {
  const result = { ...output, refreshed: 0, expired: 0 };
  for (const row of await dueConnections({ context })) {
    const refreshed = await refreshConnection({ context, row });
    if (refreshed.ok) result.refreshed++;
    else if (refreshed.error.code === "CONFLICT") result.expired++;
    else return refreshed;
  }
  return ok({ value: result });
}

/**
 * Keeps idle OAuth connections alive (ADR 0087): refresh tokens die after their provider's
 * lifetime (Fortnox: 45 days) and API calls do not extend them. SYSTEM only (the worker's daily
 * job); not registered on any surface.
 */
export const refreshExpiringIntegrations = defineOperation({
  name: "integration.refreshExpiring",
  kind: "command",
  description: "Refresh OAuth connections whose refresh token expires soon (worker only).",
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
