import { getDb } from "@bibi/db";
import { err, ok, type Result } from "../../errors/result";
import type { ExternalInput } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { checkoutUrls } from "./billing-urls";
import { getBillingGateway } from "./gateway-registry";
import { loadAccess, loadBillingRow } from "./load-billing";
import type { BillingCheckoutInput, BillingRedirectDto } from "./schema";
import { isTerminalStatus } from "./subscription-status";

type CheckoutExternalInput = ExternalInput<BillingCheckoutInput, BillingRedirectDto>;
type Context = CheckoutExternalInput["context"];

/** The organization's Stripe customer, created on the first checkout and stored (ADR 0091 §2). */
async function ensureCustomer({ context }: { context: Context }): Promise<Result<string>> {
  const row = await loadBillingRow({ context });
  if (row?.stripeCustomerId) return ok({ value: row.stripeCustomerId });
  const db = getDb();
  const [organization, user] = await Promise.all([
    db.organization.findUnique({ where: { id: context.organizationId }, select: { name: true } }),
    context.actor.userId
      ? db.user.findUnique({ where: { id: context.actor.userId }, select: { email: true } })
      : null,
  ]);
  const created = await getBillingGateway().createCustomer({
    organizationId: context.organizationId,
    name: organization?.name ?? context.organizationId,
    ...(user?.email ? { email: user.email } : {}),
  });
  if (!created.ok) return err({ error: created.error });
  const after = await context.db.billingAccount.update({
    where: { organizationId: context.organizationId },
    data: { stripeCustomerId: created.value.customerId },
  });
  context.recordChange({ entityId: after.id, before: row, after });
  return ok({ value: created.value.customerId });
}

/** Another tab or admin may have paid since the row was read: Stripe is asked, not the row. */
async function liveSubscription({ customerId }: { customerId: string }): Promise<Result<true>> {
  const found = await getBillingGateway().findSubscription({ customerId });
  if (!found.ok) return err({ error: found.error });
  if (found.value && !isTerminalStatus(found.value)) {
    return conflict({ message: "Already subscribed: open the billing portal or refresh" });
  }
  return ok({ value: true });
}

/**
 * `billing.startCheckout` after the commit (ADR 0058): the customer, then a Checkout Session.
 * During the trial the subscription starts with the rest of it, so nothing is charged early.
 */
export async function checkoutExternal({
  input,
  context,
}: CheckoutExternalInput): Promise<Result<BillingRedirectDto>> {
  const customerId = await ensureCustomer({ context });
  if (!customerId.ok) return customerId;
  const live = await liveSubscription({ customerId: customerId.value });
  if (!live.ok) return live;
  const row = await loadBillingRow({ context });
  const access = await loadAccess({ context, row });
  const urls = await checkoutUrls({ organizationId: context.organizationId, ...input });
  const session = await getBillingGateway().createCheckout({
    organizationId: context.organizationId,
    customerId: customerId.value,
    interval: input.interval,
    extraSeats: row?.extraSeats ?? 0,
    trialEnd: access.state === "TRIAL" ? access.trialEndsAt : null,
    ...urls,
  });
  if (!session.ok) return err({ error: session.error });
  return ok({ value: { url: session.value.url } });
}
