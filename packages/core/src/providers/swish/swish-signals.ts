import type { ProviderSignal, SignalKind } from "../signal";
import { swishMinor } from "./swish-format";
import type { SwishPaymentRequest, SwishRefund } from "./swish-types";

const REQUEST_KINDS: Partial<Record<SwishPaymentRequest["status"], SignalKind>> = {
  PAID: "attempt.succeeded",
  DECLINED: "attempt.failed",
  ERROR: "attempt.failed",
  CANCELLED: "attempt.cancelled",
};

const REFUND_KINDS: Partial<Record<SwishRefund["status"], SignalKind>> = {
  PAID: "refund.succeeded",
  ERROR: "refund.failed",
};

const when = ({ datePaid }: { datePaid?: string | null | undefined }) => {
  const date = datePaid ? new Date(datePaid) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const amountOf = ({ amount }: { amount?: number | string | null | undefined }) =>
  amount == null ? {} : { amountMinor: swishMinor({ amount }) };

/** The signal for a payment request's state as Swish reports it now; none while CREATED. */
export function requestSignals({ request }: { request: SwishPaymentRequest }): ProviderSignal[] {
  const kind = REQUEST_KINDS[request.status];
  if (!kind) return [];
  return [
    {
      provider: "SWISH",
      eventId: `paymentrequest:${request.id}:${request.status}`,
      kind,
      externalAccountId: request.payeeAlias,
      reference: request.id,
      ...(request.payeePaymentReference ? { paymentId: request.payeePaymentReference } : {}),
      ...amountOf(request),
      occurredAt: when(request),
    },
  ];
}

/** The signal for a refund's state now; none until it is PAID or ERROR. */
export function refundSignals({ refund }: { refund: SwishRefund }): ProviderSignal[] {
  const kind = REFUND_KINDS[refund.status];
  if (!kind) return [];
  return [
    {
      provider: "SWISH",
      eventId: `refund:${refund.id}:${refund.status}`,
      kind,
      externalAccountId: refund.payerAlias,
      reference: refund.id,
      ...(refund.payerPaymentReference ? { paymentId: refund.payerPaymentReference } : {}),
      ...amountOf(refund),
      occurredAt: when(refund),
    },
  ];
}
