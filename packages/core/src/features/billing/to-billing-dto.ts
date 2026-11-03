import type { OperationContext } from "../../operations/types";
import { type BillingRow, loadAccess, loadBillingRow } from "./load-billing";
import { BILLING_PLAN } from "./plan";
import type { BillingDto } from "./schema";
import { seatUsage } from "./seats";

type Context = { context: Pick<OperationContext, "db" | "organizationId" | "permissions"> };

/** Everything the Billing page shows, from the row (or its defaults) and the derived state. */
export async function loadBillingDto({
  context,
  row,
}: Context & { row?: BillingRow | null }): Promise<BillingDto> {
  const current = row === undefined ? await loadBillingRow({ context }) : row;
  const [access, usage] = await Promise.all([
    loadAccess({ context, row: current }),
    seatUsage({ context }),
  ]);
  const { currency, baseMonthlyMinor, baseYearlyMinor, seatMonthlyMinor } = BILLING_PLAN;
  return {
    id: current?.id ?? null,
    organizationId: context.organizationId,
    access,
    seats: {
      included: BILLING_PLAN.includedSeats,
      extra: current?.extraSeats ?? 0,
      ...usage,
    },
    autoAssignSeats: current?.autoAssignSeats ?? true,
    interval: current?.interval ?? null,
    subscriptionStatus: current?.subscriptionStatus ?? null,
    currentPeriodEnd: current?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: current?.cancelAtPeriodEnd ?? false,
    hasCustomer: Boolean(current?.stripeCustomerId),
    prices: { currency, baseMonthlyMinor, baseYearlyMinor, seatMonthlyMinor },
  };
}
