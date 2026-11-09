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

type SendInput = RefundAtProviderInput & { refundId: string; amountMinor: number };

/** Every check before the provider is called fails definitely: nothing reached it. */
async function prepare({ context, payment }: RefundAtProviderInput) {
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
  return ok({ value: { collect, auth: auth.value, reference: attempt.providerReference } });
}

/** Calls the provider for one refund; `sent` tells whether it may have reached it. */
async function send({ context, payment, refundId, amountMinor }: SendInput) {
  const ready = await prepare({ context, payment });
  if (!ready.ok) return { sent: false, result: err({ error: ready.error }) };
  const { collect, auth, reference } = ready.value;
  const result = await collect.refund({
    auth,
    providerReference: reference,
    amountMinor,
    idempotencyKey: refundKey({ refundId }),
    metadata: { paymentId: payment.id, refundId, organizationId: context.organizationId },
  });
  return { sent: true, result };
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
  const { sent, result } = await send({
    ...{ context, payment },
    ...{ refundId: own.id, amountMinor: own.amountMinor },
  });
  if (result.ok) {
    await context.db.paymentRefund.updateMany({
      where: { id: own.id, providerReference: null },
      data: { providerReference: result.value.providerReference },
    });
    return reread({ context, payment });
  }
  if (sent && isAmbiguous({ error: result.error })) {
    getLogger().warn({
      event: "payment.refundUnconfirmed",
      paymentId: payment.id,
      refundId: own.id,
    });
    const message =
      "The refund may or may not have reached the provider; it stays pending until the " +
      "provider confirms it";
    return err({ error: new AppError({ code: "UNAVAILABLE", message, cause: result.error }) });
  }
  await context.db.paymentRefund.updateMany({
    where: { id: own.id, status: "PENDING" },
    data: { status: "FAILED" },
  });
  return err({ error: result.error });
}
