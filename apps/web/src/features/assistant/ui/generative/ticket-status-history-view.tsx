"use client";

import { Card } from "@bibi/ui";
import { StatusHistoryList } from "@/features/ticket/ui/status-history-list";
import { StatusWarnings } from "@/features/ticket/ui/status-warnings";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type TicketStatusHistoryViewProps = GenerativeProps<"ticket-status-history">;

/** A ticket's status history, newest first, and the facts that contradict its status (ADR 0054). */
export function TicketStatusHistoryView({ history }: TicketStatusHistoryViewProps) {
  const dates = useDateTimeFormat();
  return (
    <Card data-slot="ticket-status-history" className="gap-2 px-4 py-3 shadow-none">
      <StatusWarnings warnings={history.warnings} />
      <StatusHistoryList dates={dates} items={history.items} />
    </Card>
  );
}
