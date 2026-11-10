import { getLogger } from "@bibi/logger";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { authFor } from "../../providers/connections";
import { findProvider } from "../../providers/registry";
import { conflict, notFound } from "../../shared/errors";
import type { PaymentDto } from "./schema";
import { PAYMENT_INCLUDE, toPaymentDto } from "./to-payment-dto";

/** The idempotency key of one refund: the same refund never pays out twice at a provider. */
export const refundKey = ({ refundId }: { refundId: string }) => `bibi-refund-${refundId}`;

/**
 * A failure after which the provider may still have made the refund (a timeout, an outage, a
 * duplicate or an unreadable answer): the refund stays PENDING and its signal settles it. Only a
 * definite refusal (VALIDATION, CONFLICT, NOT_FOUND, FORBIDDEN, UNAUTHENTICATED) is FAILED.
 */
export const isAmbiguous = ({ error }: { error: AppError }) =>
  error.code === "UNAVAILABLE" || error.code === "INTERNAL";

export type RefundAtProviderInput = { context: OperationContext; payment: PaymentDto };

type PaymentRef = Pick<PaymentDto, "id" | "provider">;
type Context = Pick<OperationContext, "db" | "organizationId">;

export type RefundTarget = { context: Context; payment: PaymentRef };

/**
 * The collect port, credentials and paid attempt a refund of the payment goes through. Every
 * check fails definitely: nothing reached the provider.
 */
export async function refundTarget({ context, payment }: RefundTarget) {
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
  return ok({
    value: {
      collect,
      auth: auth.value,
      reference: attempt.providerReference,
      connection: attempt.connection,
    },
  });
}

/** Bibi ids a refund is sent with, so the provider's event (or a lookup) finds it again. */
export const refundMetadata = ({
  context,
  payment,
  refundId,
}: RefundTarget & { refundId: string }) => ({
  paymentId: payment.id,
  refundId,
  organizationId: context.organizationId,
});

export type PreparedTarget = Extract<
  Awaited<ReturnType<typeof refundTarget>>,
  { ok: true }
>["value"];

export type SendRefundInput = RefundTarget & {
  refund: { id: string; amountMinor: number };
  /** Already prepared by the caller (the retry job read the refund through it). */
  target?: PreparedTarget;
};

/**
 * Sends one PENDING refund to the provider under its own key (a retry sends the same key, so it
 * never pays out twice). Taken: its reference is stored. A definite refusal marks it FAILED; an
 * ambiguous failure keeps it PENDING (UNAVAILABLE) for the signal or the refund retry job.
 */
export async function sendRefund({
  context,
  payment,
  refund,
  target,
}: SendRefundInput): Promise<Result<true>> {
  const ready = target ? ok({ value: target }) : await refundTarget({ context, payment });
  const result = ready.ok
    ? await ready.value.collect.refund({
        auth: ready.value.auth,
        providerReference: ready.value.reference,
        amountMinor: refund.amountMinor,
        idempotencyKey: refundKey({ refundId: refund.id }),
        metadata: refundMetadata({ context, payment, refundId: refund.id }),
      })
    : ready;
  if (result.ok) {
    await context.db.paymentRefund.updateMany({
      where: { id: refund.id, providerReference: null },
      data: { providerReference: result.value.providerReference },
    });
    return ok({ value: true });
  }
  if (ready.ok && isAmbiguous({ error: result.error })) {
    const fields = { paymentId: payment.id, refundId: refund.id };
    getLogger().warn({ event: "payment.refundUnconfirmed", ...fields });
    const message =
      "The refund may or may not have reached the provider; it stays pending until the " +
      "provider confirms it";
    return err({ error: new AppError({ code: "UNAVAILABLE", message, cause: result.error }) });
  }
  await context.db.paymentRefund.updateMany({
    where: { id: refund.id, status: "PENDING" },
    data: { status: "FAILED" },
  });
  return err({ error: result.error });
}

const reread = async ({ context, payment }: RefundAtProviderInput): Promise<Result<PaymentDto>> => {
  const row = await context.db.payment.findFirst({
    where: { id: payment.id },
    include: PAYMENT_INCLUDE,
  });
  return row ? ok({ value: toPaymentDto({ row }) }) : notFound({ entity: "Payment" });
};

/**
 * Sends the refund this `payment.refund` wrote, and only that one (its newest; the payment row
 * lock serializes refunds), after the commit (ADR 0058). A definite refusal marks it FAILED; an
 * ambiguous failure keeps it PENDING for the provider's signal and is returned as UNAVAILABLE.
 */
export async function refundAtProvider({
  context,
  payment,
}: RefundAtProviderInput): Promise<Result<PaymentDto>> {
  const own = payment.refunds.at(-1);
  if (own?.status !== "PENDING") return ok({ value: payment });
  const sent = await sendRefund({ context, payment, refund: own });
  return sent.ok ? reread({ context, payment }) : sent;
}
