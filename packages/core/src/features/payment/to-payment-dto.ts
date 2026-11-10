import type { Payment, PaymentAttempt, PaymentRefund } from "@bibi/db";
import { findProvider } from "../../providers/registry";
import type { PaymentDto } from "./schema";

/** Prisma `include` for every payment read: its latest attempt and its refunds (ADR 0100). */
export const PAYMENT_INCLUDE = {
  attempts: { orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }], take: 1 },
  refunds: {
    select: { id: true, amountMinor: true, status: true, refundedAt: true, createdAt: true },
    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
  },
};

export type RefundFacts = Pick<PaymentRefund, "amountMinor" | "status">;

export type RefundRow = Pick<
  PaymentRefund,
  "id" | "amountMinor" | "status" | "refundedAt" | "createdAt"
>;

export type PaymentRow = Payment & { attempts: PaymentAttempt[]; refunds: RefundRow[] };

export type RefundTotalsInput = { refunds: readonly RefundFacts[] };

/**
 * What a payment's refunds add up to (ADR 0057, 0100): `refundedMinor` the SUCCEEDED ones, never
 * stored; `committedMinor` also the PENDING ones, which a new refund may not exceed.
 */
export function refundTotals({ refunds }: RefundTotalsInput) {
  const sum = ({ statuses }: { statuses: readonly string[] }) =>
    refunds.filter((r) => statuses.includes(r.status)).reduce((s, r) => s + r.amountMinor, 0);
  return {
    refundedMinor: sum({ statuses: ["SUCCEEDED"] }),
    committedMinor: sum({ statuses: ["SUCCEEDED", "PENDING"] }),
  };
}

export type ToPaymentDtoInput = { row: PaymentRow };

/**
 * The payment with its latest attempt's reference, link and expiry, and its derived refunds. The
 * connection id and the public token stay internal; read through the order.
 */
export function toPaymentDto({ row }: ToPaymentDtoInput): PaymentDto {
  const { connectionId: _connection, publicToken: _token, attempts, refunds, ...payment } = row;
  const attempt = attempts[0];
  const { refundedMinor, committedMinor } = refundTotals({ refunds });
  const refundableMinor = payment.status === "SUCCEEDED" ? payment.amountMinor - committedMinor : 0;
  // A payment booked in a provider that only invoices is refunded there, not from Bibi.
  const refundsHere =
    !payment.provider || Boolean(findProvider({ key: payment.provider })?.collect);
  return {
    ...payment,
    providerReference: attempt?.providerReference ?? null,
    paymentUrl: attempt?.url ?? null,
    expiresAt: attempt?.expiresAt ?? null,
    refundedMinor,
    refundableMinor,
    refunds: refunds.map(({ id, amountMinor, status, refundedAt, createdAt }) => ({
      ...{ id, amountMinor, status, refundedAt, createdAt },
    })),
    canRefund: refundableMinor > 0 && refundsHere,
    canCancel: payment.status === "PENDING",
  };
}
