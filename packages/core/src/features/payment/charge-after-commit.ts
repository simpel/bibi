import { err, ok, type Result } from "../../errors/result";
import type { ExternalInput } from "../../operations/types";
import { authFor } from "../../providers/connections";
import { getProvider } from "../../providers/registry";
import type { AttemptRef } from "../../providers/types";
import { conflict, notFound } from "../../shared/errors";
import { loadChargeTarget } from "./payment-preconditions";
import { loadReceivable } from "./receivable";
import { requestCharge } from "./request-charge";
import type { PaymentCreateInput, PaymentDto } from "./schema";
import { PAYMENT_INCLUDE, type PaymentRow, toPaymentDto } from "./to-payment-dto";

export type ChargeAfterCommitInput = ExternalInput<PaymentCreateInput, PaymentDto>;

type AttemptInput = ChargeAfterCommitInput & { row: PaymentRow };

/** The order, customer and the payment's own connection again, then the provider's attempt. */
async function startAttempt({ input, context, row }: AttemptInput): Promise<Result<AttemptRef>> {
  const receivable = await loadReceivable({ context, input });
  if (!receivable.ok) return receivable;
  const { orderId, description } = receivable.value;
  const target = await loadChargeTarget({ context, orderId, method: input.method });
  if (!target.ok) return target;
  const connection = await context.db.providerConnection.findFirst({
    where: { id: row.connectionId ?? "" },
  });
  if (!connection || !row.provider) return conflict({ message: "The payment has no provider" });
  const adapter = getProvider({ key: row.provider });
  if (!adapter.ok) return adapter;
  const { collect } = adapter.value;
  if (!collect) return conflict({ message: `${row.provider} does not take payments` });
  const auth = await authFor({ context, row: connection });
  if (!auth.ok) return auth;
  return requestCharge({
    collect,
    auth: auth.value,
    paymentId: row.id,
    publicToken: row.publicToken,
    organizationId: context.organizationId,
    input: { ...row, method: input.method, description: input.description ?? description },
    target: target.value,
    applicationFeeMinor: row.applicationFeeMinor ?? undefined,
  });
}

/**
 * `payment.create`'s call to the provider, run by `execute` once the PENDING row is committed and
 * never by a change preview (ADR 0058). The row id is the idempotency key, so a retry for the same
 * row returns the same checkout or invoice; the attempt is recorded with its reference, link and
 * expiry (ADR 0100). The amount is the row's. A refused charge leaves the payment FAILED.
 */
export async function chargeAfterCommit({
  input,
  output,
  context,
}: ChargeAfterCommitInput): Promise<Result<PaymentDto>> {
  const row = await context.db.payment.findFirst({
    where: { id: output.id },
    include: PAYMENT_INCLUDE,
  });
  if (!row) return notFound({ entity: "Payment" });
  const charge = await startAttempt({ input, output, context, row });
  if (!charge.ok) {
    const failed = await context.db.payment.update({
      where: { id: row.id },
      data: { status: "FAILED" },
      include: PAYMENT_INCLUDE,
    });
    const after = toPaymentDto({ row: failed });
    context.recordChange({ entityId: row.id, before: toPaymentDto({ row }), after });
    return err({ error: charge.error });
  }
  const { provider } = row;
  if (!provider) return conflict({ message: "The payment has no provider" });
  const { providerReference, url, qrToken, expiresAt } = charge.value;
  const attempt = await context.db.paymentAttempt.create({
    data: {
      organizationId: context.organizationId,
      paymentId: row.id,
      method: row.method,
      provider,
      connectionId: row.connectionId,
      ...{ providerReference, url, qrToken, expiresAt },
      createdBy: context.actor.userId,
    },
  });
  const after = toPaymentDto({ row: { ...row, attempts: [attempt] } });
  context.recordChange({ entityId: row.id, before: toPaymentDto({ row }), after });
  return ok({ value: after });
}
