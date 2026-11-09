import { ok, type Result } from "../../../errors/result";
import { syncInvoice } from "../../../features/invoice/sync-operation";
import type { ExecuteContext } from "../../../operations/context";
import { execute } from "../../../operations/execute";

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
