import { err, ok, type Result } from "../../errors/result";
import type { ExternalInput } from "../../operations/types";
import { authFor } from "../../providers/connections";
import { getProvider } from "../../providers/registry";
import type { AttemptRef } from "../../providers/types";
import { conflict, notFound } from "../../shared/errors";
import { loadChargeTarget } from "./payment-preconditions";
import { loadReceivable } from "./receivable";
import { requestCharge } from "./request-charge";
import type { PaymentCreateInput, PaymentCreateMethod, PaymentDto } from "./schema";
import { PAYMENT_INCLUDE, type PaymentRow, toPaymentDto } from "./to-payment-dto";

export type ChargeAfterCommitInput = ExternalInput<PaymentCreateInput, PaymentDto>;

export type StartAtProviderInput = Pick<ChargeAfterCommitInput, "context"> & {
  row: PaymentRow;
  method: PaymentCreateMethod;
  connectionId: string | null;
  description: string | undefined;
  idempotencyKey: string;
};

/** The order, customer and the attempt's connection again, then the provider's attempt. */
export async function startAtProvider({
  context,
  row,
  method,
  connectionId,
  description,
  idempotencyKey,
}: StartAtProviderInput): Promise<Result<AttemptRef>> {
  const { quoteId, depositId, invoiceId } = row;
  const ids = {
    quoteId: quoteId ?? undefined,
    depositId: depositId ?? undefined,
    invoiceId: invoiceId ?? undefined,
  };
  const receivable = await loadReceivable({ context, input: ids });
  if (!receivable.ok) return receivable;
  const target = await loadChargeTarget({ context, orderId: row.orderId, method });
  if (!target.ok) return target;
  const connection = await context.db.providerConnection.findFirst({
    where: { id: connectionId ?? "" },
  });
  if (!connection) return conflict({ message: "The payment has no provider" });
  const adapter = getProvider({ key: connection.provider });
  if (!adapter.ok) return adapter;
  const { collect } = adapter.value;
  if (!collect) return conflict({ message: `${connection.provider} does not take payments` });
  const auth = await authFor({ context, row: connection });
  if (!auth.ok) return auth;
  return requestCharge({
    collect,
    auth: auth.value,
    paymentId: row.id,
    publicToken: row.publicToken,
    organizationId: context.organizationId,
    idempotencyKey,
    input: { ...row, method, description: description ?? receivable.value.description },
    target: target.value,
    applicationFeeMinor: row.applicationFeeMinor ?? undefined,
  });
}

/**
 * `payment.create`'s call to the provider, run by `execute` once the PENDING row is committed and
 * never by a change preview (ADR 0058). Only a provider whose attempts keep (not `onDemand`, ADR
 * 0100) gets one now; a Swish request starts at the pay page. The row id is the idempotency key, so
 * a retry for the same row returns the same checkout. A refused charge leaves the payment FAILED.
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
  const { provider } = row;
  const method = row.method === "SWISH" ? "SWISH" : "CARD";
  const adapter = provider ? getProvider({ key: provider }) : null;
  if (!provider || !adapter?.ok || adapter.value.collect?.onDemand !== false) {
    return ok({ value: output });
  }
  const charge = await startAtProvider({
    context,
    row,
    method,
    connectionId: row.connectionId,
    description: input.description,
    idempotencyKey: `bibi-payment-${row.id}`,
  });
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
  const { providerReference, url, qrToken, expiresAt } = charge.value;
  const attempt = await context.db.paymentAttempt.create({
    data: {
      organizationId: context.organizationId,
      paymentId: row.id,
      method,
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
