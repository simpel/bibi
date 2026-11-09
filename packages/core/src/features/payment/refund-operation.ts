import type { PaymentRefund } from "@bibi/db";
import { err, ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { authFor } from "../../providers/connections";
import { findProvider } from "../../providers/registry";
import { conflict, notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { type PaymentRefundInput, PaymentRefundInputSchema } from "./lifecycle-schema";
import { settleRefundStatus } from "./refund-signal";
import { type PaymentDto, PaymentSchema } from "./schema";
import { PAYMENT_INCLUDE, refundTotals, toPaymentDto } from "./to-payment-dto";

type Context = Pick<OperationContext, "db" | "organizationId" | "actor" | "recordChange" | "now">;

/** Locks the payment row for the transaction, so two refunds never both pass the amount check. */
async function lockPayment({ context, id }: { context: Context; id: string }) {
  const { count } = await context.db.payment.updateMany({
    where: { id, status: "SUCCEEDED" },
    data: { status: "SUCCEEDED" },
  });
  if (count === 0) {
    const row = await context.db.payment.findFirst({ where: { id }, select: { status: true } });
    if (!row) return notFound({ entity: "Payment" });
    return conflict({
      message: `Only a SUCCEEDED payment can be refunded; this one is ${row.status}`,
    });
  }
  return ok({
    value: await context.db.payment.findFirstOrThrow({ where: { id }, include: PAYMENT_INCLUDE }),
  });
}

/**
 * The refund row first (ADR 0058): PENDING until the provider's signal completes it, or
 * SUCCEEDED at once for a MANUAL payment no provider took.
 */
async function writeRefund({
  context,
  input,
}: {
  context: Context;
  input: PaymentRefundInput;
}): Promise<Result<PaymentDto>> {
  const locked = await lockPayment({ context, id: input.id });
  if (!locked.ok) return locked;
  const before = locked.value;
  const left = before.amountMinor - refundTotals({ refunds: before.refunds }).committedMinor;
  const amountMinor = input.amountMinor ?? left;
  if (amountMinor <= 0 || amountMinor > left) {
    return conflict({
      message: `At most ${left} minor units are left to refund`,
      issues: [{ path: "amountMinor", message: "More than is left to refund" }],
    });
  }
  const manual = before.provider === null;
  if (before.provider && !findProvider({ key: before.provider })?.collect) {
    return conflict({ message: `The payment was booked in ${before.provider}; refund it there` });
  }
  await context.db.paymentRefund.create({
    data: {
      organizationId: context.organizationId,
      paymentId: before.id,
      amountMinor,
      reason: input.reason ?? null,
      initiatedBy: context.actor.userId,
      status: manual ? "SUCCEEDED" : "PENDING",
      refundedAt: manual ? nowOf({ context }) : null,
    },
  });
  const row = await settleRefundStatus({ context, payment: before });
  const after = toPaymentDto({ row });
  context.recordChange({ entityId: row.id, before: toPaymentDto({ row: before }), after });
  return ok({ value: after });
}

type RefundAtProviderInput = { context: OperationContext; payment: PaymentDto };

/** The provider's refund for every PENDING refund of the payment not sent yet (ADR 0058). */
async function refundAtProvider({
  context,
  payment,
}: RefundAtProviderInput): Promise<Result<PaymentDto>> {
  const pending = await context.db.paymentRefund.findMany({
    where: { paymentId: payment.id, status: "PENDING", providerReference: null },
  });
  for (const refund of pending) {
    const sent = await sendRefund({ context, payment, refund });
    if (!sent.ok) {
      await context.db.paymentRefund.update({
        where: { id: refund.id },
        data: { status: "FAILED" },
      });
      return err({ error: sent.error });
    }
    await context.db.paymentRefund.update({
      where: { id: refund.id },
      data: { providerReference: sent.value },
    });
  }
  const row = await context.db.payment.findFirst({
    where: { id: payment.id },
    include: PAYMENT_INCLUDE,
  });
  return row ? ok({ value: toPaymentDto({ row }) }) : notFound({ entity: "Payment" });
}

type SendInput = RefundAtProviderInput & { refund: PaymentRefund };

async function sendRefund({ context, payment, refund }: SendInput): Promise<Result<string>> {
  const collect = payment.provider ? findProvider({ key: payment.provider })?.collect : undefined;
  if (!collect) return conflict({ message: `${payment.provider} cannot refund payments` });
  const attempt = await context.db.paymentAttempt.findFirst({
    where: { paymentId: payment.id, status: "SUCCEEDED", provider: payment.provider ?? undefined },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: { connection: true },
  });
  if (!attempt?.providerReference || !attempt.connection) {
    return conflict({ message: "The payment has no paid attempt to refund" });
  }
  const auth = await authFor({ context, row: attempt.connection });
  if (!auth.ok) return auth;
  const refunded = await collect.refund({
    auth: auth.value,
    providerReference: attempt.providerReference,
    amountMinor: refund.amountMinor,
    idempotencyKey: `bibi-refund-${refund.id}`,
    metadata: {
      paymentId: payment.id,
      refundId: refund.id,
      organizationId: context.organizationId,
    },
  });
  return refunded.ok ? ok({ value: refunded.value.providerReference }) : refunded;
}

export const refundPayment = defineOperation({
  name: "payment.refund",
  kind: "command",
  description:
    "Refund a SUCCEEDED payment in full or in part (ADR 0100). amountMinor defaults to what is " +
    "left to refund (refundableMinor) and may not exceed it (CONFLICT). The refund is made " +
    "where the payment was taken; it is PENDING until the provider confirms it, then the " +
    "payment's refundedMinor grows and a full refund makes it REFUNDED. A payment staff " +
    "recorded (MANUAL) is refunded at once: pay the money back outside Bibi.",
  input: PaymentRefundInputSchema,
  output: PaymentSchema,
  permission: "payment:refund",
  handler: ({ input, context }) => writeRefund({ context, input }),
  external: ({ output, context }) =>
    output.provider
      ? refundAtProvider({ context, payment: output })
      : Promise.resolve(ok({ value: output })),
});
