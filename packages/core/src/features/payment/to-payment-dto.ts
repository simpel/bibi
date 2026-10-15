import type { Payment } from "@okazi/db";
import type { PaymentDto } from "./schema";

export type ToPaymentDtoInput = { row: Payment };

/** The connected account id stays internal; the payment is read through its booking. */
export function toPaymentDto({ row }: ToPaymentDtoInput): PaymentDto {
  const { providerAccountId: _account, ...dto } = row;
  return dto;
}
