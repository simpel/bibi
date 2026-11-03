import { getLogger } from "@bibi/logger";
import type { OperationContext } from "../../operations/types";
import { getBillingGateway } from "./gateway-registry";
import { loadBillingRow } from "./load-billing";
import { isTerminalStatus } from "./subscription-status";

type SyncSeatsInput = { context: Pick<OperationContext, "db" | "organizationId"> };

/**
 * Puts the subscription's seat quantity at the stored `extraSeats` (ADR 0095 §6). Idempotent, so
 * every caller just runs it after a change; without a subscription there is nothing to sync.
 * Runs after the commit (a `followUp` or `external`); a failure is logged, and the next signal
 * or seat change syncs again.
 */
export async function syncSeats({ context }: SyncSeatsInput): Promise<void> {
  const row = await loadBillingRow({ context });
  if (!row?.stripeSubscriptionId || isTerminalStatus({ status: row.subscriptionStatus })) return;
  const synced = await getBillingGateway().setSeats({
    subscriptionId: row.stripeSubscriptionId,
    quantity: row.extraSeats,
  });
  if (!synced.ok) {
    getLogger().error({
      event: "billing.seatSyncFailed",
      organizationId: context.organizationId,
      err: synced.error,
    });
  }
}
