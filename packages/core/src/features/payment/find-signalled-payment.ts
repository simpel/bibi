import type { PaymentAttempt } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { PAYMENT_INCLUDE, type PaymentRow } from "./to-payment-dto";
import type { PaymentSignal } from "./webhook-schema";

export type SignalledPayment = { payment: PaymentRow; attempt: PaymentAttempt | null };

export type FindSignalledInput = {
  context: Pick<OperationContext, "db">;
  signal: PaymentSignal;
};

/**
 * The payment a signal names (ADR 0100), only on the connection the event happened on: by the
 * attempt's provider reference, else by the Bibi payment id from the provider's metadata.
 */
export async function findSignalledPayment({
  context,
  signal,
}: FindSignalledInput): Promise<SignalledPayment | null> {
  const { provider, externalAccountId, reference, paymentId } = signal;
  const connection = await context.db.providerConnection.findFirst({
    where: { provider, externalAccountId: externalAccountId ?? "" },
    select: { id: true },
  });
  if (!connection) return null;
  const attempt = reference
    ? await context.db.paymentAttempt.findFirst({
        where: { provider, providerReference: reference, connectionId: connection.id },
      })
    : null;
  const id = attempt?.paymentId ?? paymentId;
  if (!id) return null;
  const payment = await context.db.payment.findFirst({
    where: { id, connectionId: connection.id },
    include: PAYMENT_INCLUDE,
  });
  return payment ? { payment, attempt } : null;
}
