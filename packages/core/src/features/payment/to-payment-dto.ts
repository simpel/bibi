import type { Payment, PaymentAttempt } from "@bibi/db";
import type { PaymentDto } from "./schema";

/** Prisma `include` for every payment read: its latest attempt (ADR 0100). */
export const PAYMENT_INCLUDE = {
  attempts: { orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }], take: 1 },
};

export type PaymentRow = Payment & { attempts: PaymentAttempt[] };

export type ToPaymentDtoInput = { row: PaymentRow };

/**
 * The payment with its latest attempt's reference, link and expiry. The connection id and the
 * public token stay internal; read through the order.
 */
export function toPaymentDto({ row }: ToPaymentDtoInput): PaymentDto {
  const { connectionId: _connection, publicToken: _token, attempts, ...payment } = row;
  const attempt = attempts[0];
  return {
    ...payment,
    providerReference: attempt?.providerReference ?? null,
    paymentUrl: attempt?.url ?? null,
    expiresAt: attempt?.expiresAt ?? null,
  };
}
