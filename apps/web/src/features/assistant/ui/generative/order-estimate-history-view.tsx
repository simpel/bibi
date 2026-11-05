"use client";

import { Card } from "@bibi/ui";
import { EstimateHistoryList } from "@/features/order/ui/estimate-history-list";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type OrderEstimateHistoryViewProps = GenerativeProps<"order-estimate-history">;

/** An order's estimated value over time, newest first (ADR 0074). */
export function OrderEstimateHistoryView({ history }: OrderEstimateHistoryViewProps) {
  const dates = useDateTimeFormat();
  const numbers = useNumberFormat();
  return (
    <Card data-slot="order-estimate-history" className="gap-2 px-4 py-3 shadow-none">
      <EstimateHistoryList dates={dates} numbers={numbers} items={history.items} />
    </Card>
  );
}
