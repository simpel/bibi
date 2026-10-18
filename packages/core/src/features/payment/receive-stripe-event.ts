import { type Db, getDb } from "@okazi/db";
import { getLogger } from "@okazi/logger";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { createExecuteContext, type ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { grantAll } from "../../permissions/permission-set";
import { applyPaymentAccountSignal } from "../payment-account/apply-signal-operation";
import { applyPaymentSignal } from "./apply-signal-operation";
import { type StripeAction, type StripeEvent, toStripeAction } from "./stripe-webhook-event";
import type { PaymentSignal } from "./webhook-schema";

export type ReceiveStripeEventInput = { event: StripeEvent; db?: Db };

export type ReceiveStripeEventOutput = {
  status: "applied" | "duplicate" | "ignored" | "unmatched";
};

const systemContext = ({ db, organizationId }: { db: Db; organizationId: string }) =>
  createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({ upTo: "admin" }),
    actor: { type: "system", userId: null },
    db,
  });

/**
 * The one cross-organization lookup of the flow (ADR 0004): which organization owns the connected
 * account the event happened on. It only reads the id that then pins every later step.
 */
async function organizationOf({ db, action }: { db: Db; action: StripeAction }) {
  const stripeAccountId =
    action.target === "account" ? action.providerAccountId : action.signal.providerAccountId;
  const row = await db.paymentAccount.findUnique({
    where: { stripeAccountId },
    select: { organizationId: true },
  });
  return row?.organizationId ?? null;
}

type ApplyInput = { context: ExecuteContext; signal: PaymentSignal };

/** Sets the payment's status only: a payment never moves the ticket's phase (ADR 0043). */
async function applyToPayment({ context, signal }: ApplyInput): Promise<Result<true>> {
  const applied = await execute({ operation: applyPaymentSignal, input: signal, context });
  if (!applied.ok) return err({ error: applied.error });
  return ok({ value: true });
}

async function apply({ db, action }: { db: Db; action: StripeAction }): Promise<Result<true>> {
  const organizationId = await organizationOf({ db, action });
  if (!organizationId)
    return err({ error: new AppError({ code: "NOT_FOUND", message: "No account" }) });
  const context = systemContext({ db, organizationId });
  if (action.target === "account") {
    const input = { providerAccountId: action.providerAccountId };
    const done = await execute({ operation: applyPaymentAccountSignal, input, context });
    return done.ok ? ok({ value: true }) : err({ error: done.error });
  }
  return applyToPayment({ context, signal: action.signal });
}

async function claimEvent({ db, event }: { db: Db; event: StripeEvent }): Promise<boolean> {
  const { count } = await db.stripeWebhookEvent.createMany({
    data: [{ eventId: event.id, type: event.type }],
    skipDuplicates: true,
  });
  return count === 1;
}

/**
 * Handles one verified Stripe event (ADR 0028), as SYSTEM in the organization that owns the
 * connected account. Deduplicated on the Stripe event id: a redelivery changes nothing. Events we
 * do not act on, and events for unknown accounts or payments, are acknowledged so Stripe stops
 * retrying. A failure releases the event id again so Stripe's retry is processed.
 */
export async function receiveStripeEvent({
  event,
  db = getDb(),
}: ReceiveStripeEventInput): Promise<Result<ReceiveStripeEventOutput>> {
  const fields = { eventId: event.id, type: event.type };
  const action = toStripeAction({ event });
  if (!action) {
    getLogger().info({ event: "payment.webhook.ignored", ...fields });
    return ok({ value: { status: "ignored" } });
  }
  if (!(await claimEvent({ db, event }))) {
    getLogger().info({ event: "payment.webhook.duplicate", ...fields });
    return ok({ value: { status: "duplicate" } });
  }
  const done = await apply({ db, action }).catch((error: unknown) => {
    getLogger().error({ event: "payment.webhook.failed", ...fields, err: error });
    return err({ error: new AppError({ code: "INTERNAL", message: "Webhook failed" }) });
  });
  if (done.ok) {
    getLogger().info({ event: "payment.webhook.applied", ...fields });
    return ok({ value: { status: "applied" } });
  }
  if (done.error.code === "NOT_FOUND") {
    getLogger().warn({ event: "payment.webhook.unmatched", ...fields });
    return ok({ value: { status: "unmatched" } });
  }
  await db.stripeWebhookEvent.deleteMany({ where: { eventId: event.id } });
  return err({ error: done.error });
}
