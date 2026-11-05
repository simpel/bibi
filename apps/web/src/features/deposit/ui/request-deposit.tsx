import type { DepositSuggestion } from "@bibi/core";
import { getNumberFormat } from "@/server/number-format";
import { RequestDepositButton } from "./request-deposit-button";

export type RequestDepositProps = { orderId: string; suggestion: DepositSuggestion };

/**
 * "Request deposit" on the order's payments: the deposit rule's suggestion (`deposit.suggest`,
 * read by the order's payments) is formatted here and the dialog gets it as props (ADR 0090).
 */
export async function RequestDeposit({ orderId, suggestion }: RequestDepositProps) {
  const { basis, amountMinor, totalInclVatMinor } = suggestion;
  const { money } = await getNumberFormat();
  return (
    <RequestDepositButton
      orderId={orderId}
      suggestion={{
        basis,
        defaultAmount: amountMinor === null ? "" : String(amountMinor / 100),
        total: money({ minor: totalInclVatMinor }),
      }}
    />
  );
}
