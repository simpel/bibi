import type { PaymentAccount } from "@okazi/db";
import type { PaymentAccountDto } from "./schema";

export type ToDtoInput = { row: PaymentAccount | null; organizationId: string };

/** No row means the organization has not started onboarding yet. */
export function toPaymentAccountDto({ row, organizationId }: ToDtoInput): PaymentAccountDto {
  if (!row) {
    return {
      id: null,
      organizationId,
      status: "NOT_CONNECTED",
      stripeAccountId: null,
      createdAt: null,
      updatedAt: null,
    };
  }
  const { id, status, stripeAccountId, createdAt, updatedAt } = row;
  return { id, organizationId, status, stripeAccountId, createdAt, updatedAt };
}
