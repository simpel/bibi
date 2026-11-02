"use client";

import { BalanceSummary } from "@/features/payment/ui/balance-summary";
import { useNumberFormat } from "@/lib/number/use-number-format";
import type { GenerativeProps } from "./generative-props";

export type TicketBalanceCardViewProps = GenerativeProps<"ticket-balance-card">;

/** What a ticket owes, derived from its receivables and payments (ADR 0057): the stat cards. */
export function TicketBalanceCardView({ balance }: TicketBalanceCardViewProps) {
  const numbers = useNumberFormat();
  return (
    <div data-slot="ticket-balance-card">
      <BalanceSummary numbers={numbers} balance={balance} />
    </div>
  );
}
