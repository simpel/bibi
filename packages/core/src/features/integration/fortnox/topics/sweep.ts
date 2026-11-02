import { ok, type Result } from "../../../../errors/result";
import type { ExecuteContext } from "../../../../operations/context";
import { execute } from "../../../../operations/execute";
import { syncInvoice } from "../../../invoice/sync-operation";
import { fortnoxCredentials } from "../fortnox-config";

/** Fortnox keeps Topics events this long; a longer gap needs a sweep (ADR 0090). */
export const FORTNOX_REPLAY_MS = 14 * 24 * 60 * 60 * 1000;

/** The app's client secret `add-tenants-v1` needs, or null while Fortnox is not configured. */
export const fortnoxStreamSecret = (): string | null => fortnoxCredentials()?.clientSecret ?? null;

/**
 * Re-reads every SENT invoice the organization raised in Fortnox (ADR 0090). Only for when the
 * stream was down longer than Fortnox replays; nothing polls on a timer otherwise.
 */
export async function sweepFortnoxInvoices({
  context,
}: {
  context: ExecuteContext;
}): Promise<Result<{ synced: number }>> {
  const invoices = await context.db.invoice.findMany({
    where: { status: "SENT", provider: "FORTNOX" },
    select: { id: true },
  });
  let synced = 0;
  for (const { id } of invoices) {
    const done = await execute({ operation: syncInvoice, input: { id }, context });
    if (done.ok) synced++;
  }
  return ok({ value: { synced } });
}
