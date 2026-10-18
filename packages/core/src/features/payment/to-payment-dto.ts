import type { Payment } from "@okazi/db";
import type { PaymentDto } from "./schema";

export type ToPaymentDtoInput = { row: Payment };

/** The connected account id and the public token stay internal; read through the ticket. */
export function toPaymentDto({ row }: ToPaymentDtoInput): PaymentDto {
  const { providerAccountId: _account, publicToken: _token, ...dto } = row;
  return dto;
}
