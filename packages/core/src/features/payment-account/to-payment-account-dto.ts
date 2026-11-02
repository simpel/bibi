import type { PaymentAccount } from "@bibi/db";
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
  const { id, stripeAccountId, createdAt, updatedAt } = row;
  // Disconnected wins over Stripe's own state: nothing is charged until an admin reconnects.
  const status = row.disconnectedAt ? ("DISCONNECTED" as const) : row.status;
  return { id, organizationId, status, stripeAccountId, createdAt, updatedAt };
}
