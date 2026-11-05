"use client";

import { Card } from "@bibi/ui";
import { StatusHistoryList } from "@/features/order/ui/status-history-list";
import { StatusWarnings } from "@/features/order/ui/status-warnings";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type OrderStatusHistoryViewProps = GenerativeProps<"order-status-history">;

/** An order's status history, newest first, and the facts that contradict its status (ADR 0054). */
export function OrderStatusHistoryView({ history }: OrderStatusHistoryViewProps) {
  const dates = useDateTimeFormat();
  return (
    <Card data-slot="order-status-history" className="gap-2 px-4 py-3 shadow-none">
      <StatusWarnings warnings={history.warnings} />
      <StatusHistoryList dates={dates} items={history.items} />
    </Card>
  );
}
