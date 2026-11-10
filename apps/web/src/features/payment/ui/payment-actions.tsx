import { CancelPaymentButton } from "./cancel-payment-button";
import type { PaymentValue } from "./payment-entry";
import { RefundPaymentButton } from "./refund-payment-button";

export type PaymentActionsProps = {
  payment: Pick<PaymentValue, "id" | "canRefund" | "canCancel" | "refundableMinor" | "currency">;
};

/** What staff may do with a payment now, from the payment's own flags (ADR 0100). */
export function PaymentActions({ payment }: PaymentActionsProps) {
  if (!payment.canRefund && !payment.canCancel) return null;
  return (
    <>
      {payment.canRefund ? <RefundPaymentButton payment={payment} /> : null}
      {payment.canCancel ? <CancelPaymentButton id={payment.id} /> : null}
    </>
  );
}
