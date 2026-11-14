import type { Prisma, ProviderConnection } from "@bibi/db";
import type { Result } from "../../errors/result";
import { ok } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { authFor } from "../../providers/connections";
import { findProvider } from "../../providers/registry";
import { nowOf } from "../../time/now";
import { loadSetupNeeds } from "./setup-needs";

export type RunSetupCheckInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "now">;
  row: ProviderConnection;
};

/**
 * Reads the provider's accounts and codings against what Bibi books with (ADR 0108) and stores the
 * answer on the connection. A provider with nothing to check is returned as it is. Runs in
 * `external`: it calls the provider, and a token refresh must not be rolled back.
 */
export async function runSetupCheck({
  context,
  row,
}: RunSetupCheckInput): Promise<Result<ProviderConnection>> {
  const port = findProvider({ key: row.provider })?.invoicing;
  if (!port?.checkSetup) return ok({ value: row });
  const auth = await authFor({ context, row });
  if (!auth.ok) return auth;
  const needs = await loadSetupNeeds({ context });
  const found = await port.checkSetup({ auth: auth.value, needs });
  if (!found.ok) return found;
  const updated = await context.db.providerConnection.update({
    where: { id: row.id },
    data: {
      setupCheckedAt: nowOf({ context }),
      setupIssues: found.value as unknown as Prisma.InputJsonValue,
    },
  });
  return ok({ value: updated });
}
