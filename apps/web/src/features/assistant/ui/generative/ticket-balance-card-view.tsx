"use client";

import { Card } from "@bibi/ui";
import { BalanceSummary } from "@/features/payment/ui/balance-summary";
import { useNumberFormat } from "@/lib/number/use-number-format";
import type { GenerativeProps } from "./generative-props";

export type TicketBalanceCardViewProps = GenerativeProps<"ticket-balance-card">;

/** What a ticket owes, derived from its receivables and payments (ADR 0057). */
export function TicketBalanceCardView({ balance }: TicketBalanceCardViewProps) {
  const numbers = useNumberFormat();
  return (
    <Card data-slot="ticket-balance-card" className="p-4 shadow-none">
      <BalanceSummary numbers={numbers} balance={balance} />
    </Card>
  );
}
