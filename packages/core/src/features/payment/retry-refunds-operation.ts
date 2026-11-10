import { getDb, type PaymentRefund } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { execute } from "../../operations/execute";
import type { ExternalInput, OperationContext } from "../../operations/types";
import { providerSystemContext } from "../../providers/system-context";
import type { ProviderKey, RefundState } from "../../providers/types";
import { nowOf } from "../../time/now";
import { applyPaymentSignal } from "./apply-signal-operation";
import {
  PaymentRetryRefundsInputSchema,
  type PaymentRetryRefundsOutput,
  PaymentRetryRefundsOutputSchema,
} from "./lifecycle-schema";
import {
  type PreparedTarget,
  refundKey,
  refundMetadata,
  refundTarget,
  sendRefund,
} from "./refund-at-provider";

/** A refund still PENDING this long has lost its signal, or never reached the provider. */
export const REFUND_STUCK_AFTER_MS = 15 * 60_000;
const BATCH = 100;

type Context = Pick<OperationContext, "db" | "organizationId" | "now">;
type DueRefund = PaymentRefund & { payment: { id: string; provider: ProviderKey | null } };

async function dueRefunds({ context }: { context: Context }): Promise<DueRefund[]> {
  const before = new Date(nowOf({ context }).getTime() - REFUND_STUCK_AFTER_MS);
  return context.db.paymentRefund.findMany({
    where: { status: "PENDING", createdAt: { lt: before }, payment: { provider: { not: null } } },
    include: { payment: { select: { id: true, provider: true } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: BATCH,
  });
}

type SettleInput = {
  context: Context;
  refund: DueRefund;
  target: PreparedTarget;
  state: Extract<RefundState, { status: "SUCCEEDED" | "FAILED" }>;
};

/** The provider's answer as the signal its webhook would have sent, applied as SYSTEM. */
async function settle({ context, refund, target, state }: SettleInput) {
  const provider = refund.payment.provider;
  if (!provider) return false;
  const system = providerSystemContext({ db: getDb(), organizationId: context.organizationId });
  const signal = {
    provider,
    eventId: `refund-retry-${refund.id}`,
    kind: state.status === "SUCCEEDED" ? ("refund.succeeded" as const) : ("refund.failed" as const),
    externalAccountId: target.connection.externalAccountId,
    ...(state.providerReference ? { reference: state.providerReference } : {}),
    paymentId: refund.paymentId,
    refundId: refund.id,
    occurredAt: state.occurredAt,
  };
  const applied = await execute({ operation: applyPaymentSignal, input: signal, context: system });
  if (!applied.ok) {
    getLogger().error({
      event: "payment.refundRetryFailed",
      refundId: refund.id,
      err: applied.error,
    });
  }
  return applied.ok;
}

type Step = "settled" | "resent" | "waiting";

/** Reads one stuck refund at its provider and settles it, sends it again, or leaves it. */
async function retryOne({ context, refund }: { context: Context; refund: DueRefund }) {
  const fields = { refundId: refund.id, paymentId: refund.paymentId };
  const ready = await refundTarget({ context, payment: refund.payment });
  const read = ready.ok ? ready.value.collect.refundStatus : undefined;
  if (!ready.ok || !read) return "waiting";
  const target = ready.value;
  const state = await read({
    auth: target.auth,
    providerReference: target.reference,
    idempotencyKey: refundKey({ refundId: refund.id }),
    refundReference: refund.providerReference,
    metadata: refundMetadata({ context, payment: refund.payment, refundId: refund.id }),
  });
  if (!state.ok) {
    getLogger().warn({ event: "payment.refundRetryFailed", ...fields, err: state.error });
    return "waiting";
  }
  if (state.value.status === "PENDING") return "waiting";
  if (state.value.status !== "MISSING") {
    return (await settle({ context, refund, target, state: state.value })) ? "settled" : "waiting";
  }
  // Never received: the same key again, so a call that did arrive meanwhile is not paid twice.
  getLogger().info({ event: "payment.refundResent", ...fields });
  const sent = await sendRefund({ context, payment: refund.payment, refund, target });
  return sent.ok ? "resent" : sent.error.code === "UNAVAILABLE" ? "waiting" : "settled";
}

async function retryAfterCommit({
  output,
  context,
}: ExternalInput<unknown, PaymentRetryRefundsOutput>): Promise<Result<PaymentRetryRefundsOutput>> {
  const result = { ...output };
  for (const refund of await dueRefunds({ context })) {
    const step: Step = await retryOne({ context, refund });
    result[step]++;
  }
  return ok({ value: result });
}

/**
 * The refund retry job (ADR 0100): every PENDING refund older than 15 minutes is read again at
 * its provider (`collect.refundStatus`). A settled one becomes the `refund.succeeded|failed`
 * signal its webhook would have sent; one the provider never received is sent again under the
 * same idempotency key. SYSTEM only (the worker); not registered on any surface.
 */
export const retryRefunds = defineOperation({
  name: "payment.retryRefunds",
  kind: "command",
  description: "Resolve refunds stuck PENDING at their provider (worker only).",
  input: PaymentRetryRefundsInputSchema,
  output: PaymentRetryRefundsOutputSchema,
  permission: "payment:refund",
  entityType: "payment",
  approval: false,
  aiAllowed: false,
  handler: async ({ context }) => {
    if (context.actor.type !== "system") {
      const message = "Stuck refunds are retried by the worker only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const due = (await dueRefunds({ context })).length;
    return ok({ value: { due, settled: 0, resent: 0, waiting: 0 } });
  },
  external: retryAfterCommit,
});
