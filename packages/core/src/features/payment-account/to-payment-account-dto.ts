import type { ProviderConnection } from "@bibi/db";
import type { PaymentAccountDto } from "./schema";

export type ToDtoInput = { row: ProviderConnection | null; organizationId: string };

/** The connection's status as the payout account shows it (ADR 0028, 0090). */
function accountStatus({ row }: { row: ProviderConnection }): PaymentAccountDto["status"] {
  // Disconnected wins over the provider's own state: nothing is charged until an admin reconnects.
  if (row.disconnectedAt || row.status === "DISCONNECTED") return "DISCONNECTED";
  if (row.status === "CONNECTED") return "ACTIVE";
  return row.status === "RESTRICTED" ? "RESTRICTED" : "ONBOARDING";
}

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
  const { id, externalAccountId, createdAt, updatedAt } = row;
  const status = accountStatus({ row });
  return { id, organizationId, status, stripeAccountId: externalAccountId, createdAt, updatedAt };
}
