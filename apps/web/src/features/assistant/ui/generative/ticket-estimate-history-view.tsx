"use client";

import { Card } from "@bibi/ui";
import { EstimateHistoryList } from "@/features/ticket/ui/estimate-history-list";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type TicketEstimateHistoryViewProps = GenerativeProps<"ticket-estimate-history">;

/** A ticket's estimated value over time, newest first (ADR 0074). */
export function TicketEstimateHistoryView({ history }: TicketEstimateHistoryViewProps) {
  const dates = useDateTimeFormat();
  const numbers = useNumberFormat();
  return (
    <Card data-slot="ticket-estimate-history" className="gap-2 px-4 py-3 shadow-none">
      <EstimateHistoryList dates={dates} numbers={numbers} items={history.items} />
    </Card>
  );
}
