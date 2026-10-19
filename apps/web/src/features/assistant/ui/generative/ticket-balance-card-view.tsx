"use client";

import { Card } from "@okazi/ui";
import { BalanceSummary } from "@/features/payment/ui/balance-summary";
import type { GenerativeProps } from "./generative-props";

export type TicketBalanceCardViewProps = GenerativeProps<"ticket-balance-card">;

/** What a ticket owes, derived from its receivables and payments (ADR 0057). */
export function TicketBalanceCardView({ balance }: TicketBalanceCardViewProps) {
  return (
    <Card data-slot="ticket-balance-card" className="p-4 shadow-none">
      <BalanceSummary balance={balance} />
    </Card>
  );
}
