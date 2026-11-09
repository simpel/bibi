import { type Db, getDb } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { ok, type Result } from "../errors/result";
import { syncInvoice } from "../features/invoice/sync-operation";
import { execute } from "../operations/execute";
import type { ProviderKey } from "./provider-keys";
import { providerSystemContext } from "./system-context";

export type SweepProviderInvoicesInput = { provider: ProviderKey; db?: Db };
export type SweepOutcome = { organizations: number; synced: number };

/**
 * Re-reads every SENT invoice raised in a provider, in every organization that has one, through
 * `invoice.sync` as SYSTEM (ADR 0100): a provider's poll, and a stream's catch-up after it was
 * away longer than the provider replays. One organization's failure is logged and skipped.
 */
export async function sweepProviderInvoices({
  provider,
  db = getDb(),
}: SweepProviderInvoicesInput): Promise<Result<SweepOutcome>> {
  const where = { status: "SENT" as const, provider };
  const owners = await db.invoice.findMany({
    where,
    distinct: ["organizationId"],
    select: { organizationId: true },
    orderBy: { organizationId: "asc" },
  });
  const outcome = { organizations: owners.length, synced: 0 };
  for (const { organizationId } of owners) {
    const context = providerSystemContext({ db, organizationId });
    const invoices = await context.db.invoice.findMany({ where, select: { id: true } });
    for (const { id } of invoices) {
      const done = await execute({ operation: syncInvoice, input: { id }, context });
      if (done.ok) outcome.synced++;
      else
        getLogger().warn({
          event: "provider.sweepFailed",
          provider,
          organizationId,
          err: done.error,
        });
    }
  }
  return ok({ value: outcome });
}
