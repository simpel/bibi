import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { PROVIDER_KEYS } from "../../providers/provider-keys";
import { findProvider } from "../../providers/registry";
import { notFound } from "../../shared/errors";
import { refreshAccountStatus } from "../payment-account/refresh-status";

const ConnectionSignalSchema = z.object({
  provider: z.enum(PROVIDER_KEYS),
  externalAccountId: z.string().min(1).describe("The provider's id of the account that changed"),
});

const ConnectionSignalResultSchema = z.object({
  connectionId: z.string(),
  status: z.enum(["PENDING", "ONBOARDING", "CONNECTED", "RESTRICTED", "EXPIRED", "DISCONNECTED"]),
  changed: z.boolean(),
});

/**
 * Applies a `connection.status` signal (ADR 0100): the provider says an account changed, so its
 * status is read back from the provider (never trusted from the event) and stored. SYSTEM only, so
 * it is not part of `createCoreOperations` and has no adapters. Only hosted onboarding accounts
 * report their status this way; other providers' connections are left as they are.
 */
export const applyIntegrationSignal = defineOperation({
  name: "integration.applySignal",
  kind: "command",
  description: "Refresh a provider connection's status after a provider event (webhooks only).",
  input: ConnectionSignalSchema,
  output: ConnectionSignalResultSchema,
  permission: "integration:write",
  entityType: "integrationConnection",
  approval: false,
  handler: async ({ input, context }) => {
    if (context.actor.type !== "system") {
      const message = "Connections are updated by the provider's events only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const before = await context.db.providerConnection.findFirst({
      where: { provider: input.provider, externalAccountId: input.externalAccountId },
    });
    if (!before) return notFound({ entity: "Connection" });
    const unchanged = { connectionId: before.id, status: before.status, changed: false };
    if (findProvider({ key: input.provider })?.connect.kind !== "HOSTED_ONBOARDING") {
      return ok({ value: unchanged });
    }
    const refreshed = await refreshAccountStatus({ context, before });
    if (!refreshed.ok) return refreshed;
    const { row, changed } = refreshed.value;
    return ok({ value: { connectionId: row.id, status: row.status, changed } });
  },
});
