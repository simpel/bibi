import { type Db, getDb } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { createExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { grantAll } from "../../permissions/permission-set";
import { applyBillingSignal } from "./apply-signal-operation";
import { type BillingAction, type BillingEvent, toBillingAction } from "./billing-event";

export type ReceiveBillingEventOutput = {
  status: "applied" | "duplicate" | "ignored" | "unmatched";
};

/** The one cross-organization read: which organization owns the event's Stripe customer. */
async function organizationOf({ db, action }: { db: Db; action: BillingAction }) {
  if (!action.customerId) return null;
  const row = await db.billingAccount.findUnique({
    where: { stripeCustomerId: action.customerId },
    select: { organizationId: true },
  });
  return row?.organizationId ?? null;
}

async function apply({ db, action }: { db: Db; action: BillingAction }): Promise<Result<true>> {
  const organizationId = await organizationOf({ db, action });
  if (!organizationId)
    return err({ error: new AppError({ code: "NOT_FOUND", message: "No customer" }) });
  const context = createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "system", userId: null },
    db,
  });
  const input = { subscriptionId: action.subscriptionId };
  const done = await execute({ operation: applyBillingSignal, input, context });
  return done.ok ? ok({ value: true }) : err({ error: done.error });
}

async function claim({ db, event }: { db: Db; event: BillingEvent }) {
  const data = [{ provider: "STRIPE" as const, eventId: event.id, type: event.type }];
  const { count } = await db.providerEventReceipt.createMany({ data, skipDuplicates: true });
  return count === 1;
}

/**
 * Handles one verified Stripe Billing event (ADR 0095 §8) as SYSTEM in the organization that owns
 * the customer; deduplicated on the event id like the Connect webhook. A failure releases the id
 * so Stripe's retry is processed.
 */
export async function receiveBillingEvent({
  event,
  db = getDb(),
}: {
  event: BillingEvent;
  db?: Db;
}): Promise<Result<ReceiveBillingEventOutput>> {
  const fields = { eventId: event.id, type: event.type };
  const action = toBillingAction({ event });
  if (!action) return ok({ value: { status: "ignored" } });
  if (!(await claim({ db, event }))) return ok({ value: { status: "duplicate" } });
  const done = await apply({ db, action }).catch((error: unknown) => {
    getLogger().error({ event: "billing.webhook.failed", ...fields, err: error });
    return err({ error: new AppError({ code: "INTERNAL", message: "Webhook failed" }) });
  });
  if (done.ok) {
    getLogger().info({ event: "billing.webhook.applied", ...fields });
    return ok({ value: { status: "applied" } });
  }
  if (done.error.code === "NOT_FOUND") {
    getLogger().warn({ event: "billing.webhook.unmatched", ...fields });
    return ok({ value: { status: "unmatched" } });
  }
  await db.providerEventReceipt.deleteMany({ where: { provider: "STRIPE", eventId: event.id } });
  return err({ error: done.error });
}
