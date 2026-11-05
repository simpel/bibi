"use client";

import { BalanceSummary } from "@/features/payment/ui/balance-summary";
import { useNumberFormat } from "@/lib/number/use-number-format";
import type { GenerativeProps } from "./generative-props";

export type OrderBalanceCardViewProps = GenerativeProps<"order-balance-card">;

/** What an order owes, derived from its receivables and payments (ADR 0057): the stat cards. */
export function OrderBalanceCardView({ balance }: OrderBalanceCardViewProps) {
  const numbers = useNumberFormat();
  return (
    <div data-slot="order-balance-card">
      <BalanceSummary numbers={numbers} balance={balance} />
    </div>
  );
}
