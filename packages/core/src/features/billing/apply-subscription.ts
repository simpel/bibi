import { getLogger } from "@bibi/logger";
import type { OperationContext } from "../../operations/types";
import type { BillingSubscription } from "./gateway";
import type { BillingRow } from "./load-billing";
import { isTerminalStatus } from "./subscription-status";

type ApplyInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "recordChange">;
  subscription: BillingSubscription;
};

/** The Stripe snapshot columns (ADR 0091 §2); only this function writes them. */
const snapshotOf = ({ subscription }: { subscription: BillingSubscription }) => ({
  stripeCustomerId: subscription.customerId,
  stripeSubscriptionId: subscription.subscriptionId,
  subscriptionStatus: subscription.status,
  interval: subscription.interval,
  currentPeriodEnd: subscription.currentPeriodEnd,
  cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
});

type Snapshot = ReturnType<typeof snapshotOf>;

const unchanged = ({ row, next }: { row: BillingRow; next: Snapshot }) =>
  (Object.keys(next) as (keyof typeof next)[]).every(
    (key) => String(row[key] ?? "") === String(next[key] ?? ""),
  );

/**
 * Whether an event for another subscription than the stored one may replace it: only a live one
 * replacing a finished one, so a late event of an old or duplicate subscription never locks out
 * an organization that pays.
 */
function supersedes({
  row,
  subscription,
}: {
  row: BillingRow | null;
  subscription: BillingSubscription;
}) {
  if (!row?.stripeSubscriptionId || row.stripeSubscriptionId === subscription.subscriptionId)
    return true;
  return isTerminalStatus({ status: row.subscriptionStatus }) && !isTerminalStatus(subscription);
}

/** Mirrors a subscription read back from Stripe onto the billing row; returns whether it changed. */
export async function applySubscription({ context, subscription }: ApplyInput): Promise<boolean> {
  const before = await context.db.billingAccount.findFirst({});
  const next = snapshotOf({ subscription });
  if (before && unchanged({ row: before, next })) return false;
  if (supersedes({ row: before, subscription }) === false) {
    getLogger().warn({
      event: "billing.staleSubscriptionIgnored",
      organizationId: context.organizationId,
      subscriptionId: subscription.subscriptionId,
    });
    return false;
  }
  const after = await context.db.billingAccount.upsert({
    where: { organizationId: context.organizationId },
    create: { organizationId: context.organizationId, ...next },
    update: next,
  });
  context.recordChange({ entityId: after.id, before, after });
  return true;
}
